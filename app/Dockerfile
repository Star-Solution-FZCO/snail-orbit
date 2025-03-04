FROM python:3.12-alpine3.20 AS get_requirements
WORKDIR /app
COPY pyproject.toml poetry.lock /app/
RUN python3 -m pip install --upgrade pip poetry && \
    poetry self add poetry-plugin-export && \
    poetry export --without-hashes --format=requirements.txt > /app/requirements.txt && \
    poetry export --without-hashes --format=requirements.txt --with ocr > /app/requirements-ocr.txt && \
    poetry export --without-hashes --format=requirements.txt --with dev,ocr > /app/requirements-dev.txt

FROM python:3.12-alpine3.20 AS back-common

ENV APP_DIR=/app
ENV APP_NAME=pm
ENV PYTHONPATH="${APP_DIR}:${APP_DIR}/vendor"
WORKDIR ${APP_DIR}

RUN apk add --update --no-cache\
    build-base libffi-dev &&\
    rm -rf "/var/cache/apk/*" &&\
    python3 -m pip install --no-cache-dir --upgrade pip

RUN mkdir -p "${APP_DIR}/etc" &&\
    ln -s ${APP_DIR}/etc/settings.toml ${APP_DIR}/settings.toml &&\
    addgroup -g 998 ${APP_NAME} &&\
    adduser -u 999 -G ${APP_NAME} -h ${APP_DIR} -D ${APP_NAME}

COPY contrib/fonts/Montserrat-Alt1/MontserratAlt1-Regular.ttf /usr/share/fonts/truetype/


FROM back-common AS api

COPY --from=get_requirements /app/requirements.txt ${APP_DIR}/requirements.txt
RUN python3 -m pip install --no-cache-dir -r requirements.txt &&\
    rm -rf requirements.txt
RUN mkdir -p /data &&\
    chown ${APP_NAME}:${APP_NAME} /data

COPY manage.py ${APP_DIR}/
COPY pm ${APP_DIR}/pm

ARG version="__DEV__"
RUN echo $version > ${APP_DIR}/version.txt

USER ${APP_NAME}
VOLUME ["${APP_DIR}/etc"]
VOLUME ["/data"]
ENTRYPOINT ["python3", "manage.py", "api", "server", "--host", "0.0.0.0", "--trusted-proxy", "*"]


FROM api AS tasks
ENTRYPOINT ["python3", "manage.py", "tasks"]
CMD ["worker"]


FROM python:3.12-slim AS ocr

ENV APP_DIR=/app
ENV APP_NAME=pm
ENV PYTHONPATH="${APP_DIR}:${APP_DIR}/vendor"
WORKDIR ${APP_DIR}

COPY --from=get_requirements /app/requirements-ocr.txt ${APP_DIR}/requirements.txt
RUN python3 -m pip install --no-cache-dir -r requirements.txt &&\
    rm -rf requirements.txt

RUN mkdir -p "${APP_DIR}/etc" &&\
    ln -s ${APP_DIR}/etc/settings.toml ${APP_DIR}/settings.toml &&\
    groupadd -r -g 998 ${APP_NAME} &&\
    useradd -u 999 -g 998 -d ${APP_DIR} -r -c ${APP_NAME} ${APP_NAME} &&\
    mkdir -p /data &&\
    chown ${APP_NAME}:${APP_NAME} /data &&\
    mkdir -p /var/easyocr &&\
    chown ${APP_NAME}:${APP_NAME} /var/easyocr

COPY manage.py ${APP_DIR}/
COPY pm ${APP_DIR}/pm

ARG version="__DEV__"
RUN echo $version > ${APP_DIR}/version.txt

USER ${APP_NAME}
VOLUME ["${APP_DIR}/etc"]
VOLUME ["/data"]
VOLUME ["/var/easyocr"]
ENTRYPOINT ["python3", "manage.py", "ocr"]


FROM python:3.12-slim AS test

WORKDIR /app

COPY --from=get_requirements /app/requirements-dev.txt /app/requirements.txt
RUN python3 -m pip install --no-cache-dir -r requirements.txt &&\
    rm -rf requirements.txt
