FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:alpine
WORKDIR /app
COPY --from=builder /app/build .
COPY contrib/nginx.conf /etc/nginx/conf.d/default.conf
