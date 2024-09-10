FROM python:3.12-alpine3.20 AS get_requirements
WORKDIR /app
COPY Pipfile Pipfile.lock /app/
RUN python3 -m pip install --upgrade pip pipenv && \
    pipenv requirements > /app/requirements.txt && \
    pipenv requirements --dev > /app/requirements-dev.txt

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

COPY . ${APP_DIR}/

USER ${APP_NAME}
VOLUME ["${APP_DIR}/etc"]
ARG version="__DEV__"
ENV APP_VERSION=$version
ENTRYPOINT ["python3", "manage.py", "api", "--host", "0.0.0.0", "--trusted-proxy", "*"]


FROM api AS tasks
ENTRYPOINT ["python3", "manage.py", "tasks"]
CMD ["worker"]
