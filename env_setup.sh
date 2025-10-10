#!/bin/bash

# 提供された環境名に基づき、適切な.env.*ファイルを.envにコピーするスクリプトです。
# 使い方: このスクリプトを環境名（例: staging, production）を引数として呼び出します。
# 'docker compose up'コマンドの前に実行してください。

ENV=$1

# 環境名が指定されていない場合はエラーで終了します。
if [ -z "$ENV" ]; then
  echo "エラー: 環境が指定されていません（例: staging, production）。"
  exit 1
fi

ENV_FILE=".env.${ENV}"

# 対応する環境ファイルが存在するか確認します。
if [ ! -f "$ENV_FILE" ]; then
  echo "エラー: 環境ファイルが見つかりません: ${ENV_FILE}"
  exit 1
fi

# docker-composeが使用できるように、環境ファイルを.envにコピーします。
echo "${ENV_FILE} に切り替えています..."
cp "$ENV_FILE" .env
echo "${ENV} 環境の.env設定が完了しました。"
