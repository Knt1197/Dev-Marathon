#!/bin/bash
set -e

ENV=$1
if [ -z "$ENV" ]; then
  echo "Usage: $0 [staging|production]"
  exit 1
fi

USER_NAME="kanta_maruhashi"
APP_DIR="/app/$USER_NAME"
WEB_DIR="/usr/share/nginx/html/$USER_NAME"
PORT=5228

cd "$APP_DIR"
set -a
source ".env.${ENV}"
set +a

rm -rf "$WEB_DIR"/*
cp -r ./src/web/* "$WEB_DIR/"

CONFIG_SRC=""
[ "$ENV" = "production" ] && CONFIG_SRC="prod_config.js"
[ "$ENV" = "staging" ] && CONFIG_SRC="staging_config.js"

if [ -n "$CONFIG_SRC" ] && [ -f "$WEB_DIR/$CONFIG_SRC" ]; then
  mv "$WEB_DIR/$CONFIG_SRC" "$WEB_DIR/config.js"
fi

OLD_PID=$(lsof -ti tcp:$PORT || true)
[ -n "$OLD_PID" ] && kill -9 $OLD_PID || true

cd "$APP_DIR/src/node"
npm install --omit=dev
cp "$APP_DIR/.env" "$APP_DIR/src/node/.env"
nohup node index.js >/dev/null 2>&1 &
