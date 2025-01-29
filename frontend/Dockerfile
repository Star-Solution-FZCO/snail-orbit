FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build


FROM --platform=$BUILDPLATFORM node:20-alpine AS test
COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile --production=false
RUN yarn config set -- --modules-folder /node_modules && \
    rm -rf package.json yarn.lock
ENV PATH="/node_modules/.bin:$PATH"
WORKDIR /app


FROM nginx:alpine AS ui
WORKDIR /app

RUN apk add --no-cache util-linux moreutils && \
    rm -rf "/var/cache/apk/*"

COPY --from=builder /app/build /app
COPY env.template.js /app/env.template.js
COPY contrib/nginx.conf /etc/nginx/conf.d/default.conf
COPY contrib/99-setup-env.sh /docker-entrypoint.d/99-setup-env.sh

ARG version="__DEV__"
RUN echo $version > /app/version.txt
