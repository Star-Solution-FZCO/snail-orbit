#!/bin/sh

set -e

export ENV_FILENAME_HASH=$(uuidgen | cut -c 1-8)

if [ -f /app/version.txt ] ; then
  export APP_VERSION=$(cat /app/version.txt)
fi

envsubst < /app/index.html | sponge /app/index.html
envsubst < /app/env.template.js > "/app/assets/env-${ENV_FILENAME_HASH}.js"
rm /app/env.template.js
