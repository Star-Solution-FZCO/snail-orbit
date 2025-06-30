FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /src/frontend
COPY frontend/package.json .
COPY frontend/yarn.lock .
RUN yarn install --frozen-lockfile
COPY frontend .
COPY app/openapi.json /src/app/openapi.json

ARG SENTRY_ORG=""
ARG SENTRY_PROJECT=""
ARG SENTRY_RELEASE=""
ARG SENTRY_AUTH_TOKEN=""

ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_PROJECT=${SENTRY_PROJECT}
ENV SENTRY_RELEASE=${SENTRY_RELEASE}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

RUN yarn build


FROM --platform=$BUILDPLATFORM node:20-alpine AS test
COPY frontend/package.json .
COPY frontend/yarn.lock .
RUN yarn install --frozen-lockfile --production=false
RUN yarn config set -- --modules-folder /node_modules && \
    rm -rf package.json yarn.lock
ENV PATH="/node_modules/.bin:$PATH"


FROM nginx:alpine AS ui
WORKDIR /app

RUN apk add --no-cache util-linux moreutils && \
    rm -rf "/var/cache/apk/*"

COPY --from=builder /src/frontend/build /app
COPY frontend/env.template.js /app/env.template.js
COPY frontend/contrib/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/contrib/99-setup-env.sh /docker-entrypoint.d/99-setup-env.sh

ARG version="__DEV__"
RUN echo $version > /app/version.txt
