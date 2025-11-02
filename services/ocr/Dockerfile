FROM python:3.12-alpine3.20 AS get_requirements
WORKDIR /app
COPY pyproject.toml uv.lock /app/
RUN python3 -m pip install --upgrade pip uv && \
    uv export --format requirements-txt --no-dev > /app/requirements.txt && \
    uv export --format requirements-txt --dev > /app/requirements-dev.txt


FROM python:3.12-slim AS ocr

WORKDIR /app

COPY --from=get_requirements /app/requirements.txt ./requirements.txt
RUN python3 -m pip install --no-cache-dir -r requirements.txt &&\
    rm -rf requirements.txt

RUN mkdir -p /app/etc &&\
    ln -s /app/etc/settings.toml /app/settings.toml &&\
    groupadd -r -g 998 ocr &&\
    useradd -u 999 -g 998 -d /app -r -c ocr ocr &&\
    mkdir -p /var/easyocr &&\
    chown ocr:ocr /var/easyocr

COPY ocr /app/ocr

ARG version="__DEV__"
RUN echo $version > /app/version.txt

USER ocr
VOLUME ["/app/etc"]
VOLUME ["/var/easyocr"]
ENTRYPOINT ["taskiq", "worker", "-w", "1", "--use-process-pool", "--max-process-pool-processes=1", "ocr.worker:broker"]
