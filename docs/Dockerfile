FROM --platform=$BUILDPLATFORM node:22-slim AS builder
WORKDIR /build
RUN apt update && \
    apt install -y git
RUN git clone --branch v4.5.2 --single-branch https://github.com/jackyzha0/quartz.git . && \
    npm install

COPY user /src
COPY contrib/icon.png ./quartz/static/
COPY contrib/quartz.config.ts ./
COPY contrib/quartz.layout.ts ./
RUN npx quartz build --directory=/src


FROM nginx:alpine AS ui
WORKDIR /app
COPY --from=builder /build/public /app
COPY contrib/nginx.conf /etc/nginx/conf.d/default.conf
