FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
RUN npm install -g pnpm@latest

WORKDIR /src/frontend
COPY frontend/package.json .
COPY frontend/pnpm-lock.yaml .
COPY frontend/pnpm-workspace.yaml .
RUN pnpm install --frozen-lockfile
COPY frontend .
COPY app/openapi.json /src/app/openapi.json

ARG SENTRY_ORG=""
ARG SENTRY_PROJECT=""
ARG SENTRY_AUTH_TOKEN=""
ARG version="__DEV__"

ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_PROJECT=${SENTRY_PROJECT}
ENV SENTRY_RELEASE="snail-orbit@${version}"
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

RUN pnpm build


FROM --platform=$BUILDPLATFORM node:20-alpine AS test
WORKDIR /pnpm
RUN npm install -g pnpm@latest

COPY frontend/package.json .
COPY frontend/pnpm-lock.yaml .
COPY frontend/pnpm-workspace.yaml .
RUN pnpm install --frozen-lockfile
RUN pnpm config set modulesDir=/pnpm/node_modules && \
    pnpm config set nodeLinker=hoisted && \
    pnpm config set enableModulesDir=false && \
    rm -rf package.json pnpm-lock.yaml pnpm-workspace.yaml
ENV PATH="/pnpm/node_modules/.bin:$PATH"


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
