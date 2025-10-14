# Dev-Marathon CRM

フロントエンド (静的 HTML/ES Modules) とバックエンド (Node.js + Express) で構成された軽量 CRM アプリケーションです。Docker を利用したローカル開発、Cypress による E2E テスト、GitHub Actions を用いたステージング/本番デプロイの自動化をサポートしています。

---

## プロジェクト構成 (主要ディレクトリ)

```
├─ compose.yml                # 開発用 Docker Compose (nginx/app/db/pgadmin)
├─ src/
│  ├─ node/                  # Node.js バックエンド (Express API + PostgreSQL)
│  └─ web/                   # スタティックフロント (HTML/JS/CSS)
├─ cypress/                  # ローカル実行用サンプル E2E テスト
├─ .github/workflows/        # GitHub Actions (develop / main ブランチ用)
├─ deploy_staging.sh         # ステージング環境向けデプロイスクリプト
├─ deploy_production.sh      # 本番環境向けデプロイスクリプト
└─ setup_instructions/       # サーバーセットアップ参考資料
```

---

## バックエンド (src/node)

| 項目 | 内容 |
| ---- | ---- |
| フレームワーク | Express 4 |
| 主な依存 | express, cors, pg, dotenv |
| エントリーポイント | `index.js` |
| ポート | 5228 (固定) |
| エンドポイント例 | `GET /customers`, `POST /add-customer`, `PUT /customers/:id`, `DELETE /customers/:id` |

- `.env` を介して PostgreSQL 接続情報を取得します。デプロイスクリプトが `.env.staging` / `.env.production` を `.env` と `src/node/.env` にコピーすることで環境切り替えを行います。
- `npm install` / `npm start` / `npm run dev` (`nodemon`) を利用可能です。

---

## フロントエンド (src/web)

| 項目 | 内容 |
| ---- | ---- |
| 技術 | 素の HTML + ES Modules |
| 共通スタイル | `assets/css/style.css` (緑系テーマ) |
| API エンドポイント | `config.js` (開発), `staging_config.js`, `prod_config.js` |

- `customer/` 配下に顧客の一覧/詳細/登録/編集フローを実装しています。案件 (`case/`)、交渉 (`negotiation/`) フォルダも用意されています。
- `index.html` はダッシュボード的なトップ画面としてショートカットを提供します。

---

## データベース

- PostgreSQL を想定しており、`.env.*` で接続設定 (ユーザー/DB 名/パスワード等) を管理します。
- `compose.yml` を使うと `postgres:17-alpine` コンテナと `pgadmin` コンテナをローカルに起動できます。

---

## 実行・開発環境

### ローカル (Docker Compose)

```
docker compose up -d
``` 

| サービス | 役割 | 主な設定 |
| -------- | ---- | -------- |
| `web` | nginx (静的ファイル配信) | `./src/web` を `/usr/share/nginx/html` にマウント |
| `app` | Node.js アプリ | `./src/node` を `/app` にマウントし `npm install && npm start` |
| `db` | PostgreSQL | `.env` から資格情報を読み込み |
| `pgadmin` | 管理 GUI | `.env` のメール/パスワードを使用 |

### サーバー環境

- ステージング/本番の両方で `/app/kanta_maruhashi` (バックエンド) と `/usr/share/nginx/html/kanta_maruhashi` (フロント) が使われます。
- `lsof` が必要です。`deploy_*.sh` ではポート 5228 を握る既存 Node プロセスを停止してから `nohup node index.js` で再起動します。

---

## デプロイスクリプト

| ファイル | 役割 | 主な動作 |
| -------- | ---- | -------- |
| `deploy_staging.sh` | ステージング環境の更新 | `git reset --hard origin/<branch>` 済みコードに対し Web 資産をコピー、`staging_config.js` を `config.js` にリネーム、`.env.staging` を適用し Node を再起動 |
| `deploy_production.sh` | 本番環境の更新 | 上記の本番版 (`prod_config.js` と `.env.production`) |

両スクリプトとも以下の流れは共通です。
1. `.env.<ENV>` 読み込み → `.env` と `src/node/.env` に複製。
2. `/usr/share/nginx/html/<ユーザー名>` を入れ替え、環境別 `config.js` を適用。
3. `lsof` + `kill -9` でポート 5228 の旧プロセスを停止 → `npm install --omit=dev` → `nohup node index.js`。

---

## CI/CD フロー (GitHub Actions)

### develop ブランチ (`.github/workflows/develop.yml`)

1. リポジトリチェックアウト。
2. ステージングサーバーへ SSH 接続 (`appleboy/ssh-action`)。
3. 未追跡のデプロイスクリプトを削除 → `git fetch origin develop` → `git reset --hard origin/develop`。
4. `npm install` → `deploy_staging.sh` を実行 (環境変数とアプリ再起動)。

> `develop` ブランチはステージング環境用コードを保持する運用です。テスト実行は行っていません。

### main ブランチ (`.github/workflows/main.yml`)

1. リポジトリチェックアウト。
2. **ステージングへデプロイ**: `deploy_staging.sh` を用いて `origin/main` の成果物をステージングサーバーに反映。
3. **ステージングで Cypress テスト**: `/ci/` ディレクトリ上の `kanta_maruhashi.cy.js` (サーバー配置) を Chrome ヘッドレスで実行。スクリーンショット/動画は無効化済み (`cypress.config.js`)。テストが失敗するとここでジョブは終了。
4. **本番デプロイ**: テスト成功時のみ本番サーバーに SSH → 未追跡ファイルを削除 → `git pull origin main` → `deploy_production.sh` 実行。

### GitHub Secrets (例)

| キー | 用途 |
| ---- | ---- |
| `DEV_SSH_HOST`, `DEV_SSH_PORT`, `DEV_SSH_USER`, `DEV_SSH_SSH_KEY` | ステージングサーバー用 SSH 接続情報 |
| `MAIN_SSH_HOST`, `MAIN_SSH_PORT`, `MAIN_SSH_USER`, `MAIN_SSH_SSH_KEY` | 本番サーバー用 SSH 接続情報 |

---

## Cypress テスト

- `cypress.config.js` で動画/スクリーンショット出力を停止 (`video: false`, `screenshotOnRunFailure: false`)。
- リポジトリ内にはサンプル (`spec.cy.js` など) があり、ステージング実環境では `/ci/cypress/e2e/kanta_maruhashi.cy.js` を配置して実行しています。
- `cypress/fixtures` 配下のデータを利用する場合はサーバー上にも同ファイルを配置してください。

---

## セットアップメモ

- `.env`, `.env.staging`, `.env.production` で環境ごとの設定を管理。デプロイ時にコピーされるため、本番資格情報はサーバー側で安全に保管してください。
- サーバーで CI/CD を動かす場合、必要に応じて `/ci/cypress` ディレクトリのパーミッション調整 (`chown`/`chmod`) を行い、Chrome/Node/npm が利用できる状態にしておきます。
- `lsof` が未インストールの場合は `sudo apt install lsof` などで導入してください。

---

## 参考スクリプト / ドキュメント

- `setup_instructions/deploy_sh_content.txt` : デプロイスクリプトの参考テンプレート。
- `setup_instructions/pm2_setup_instructions.txt` : pm2 でのプロセスマネージャ運用メモ（現状は `nohup` に統一）。
- `env_setup.sh` : ローカル開発での環境セットアップ補助。

---

## Author & License

- Author: Knt11 (Kanta Maruhashi)  
- License: Not specified (プロジェクトに合わせて必要に応じて追記してください)  

---

ご不明点や改善提案があれば Issue や Pull Request でお知らせください。スクリプトやワークフローの更新時には、関連する環境ファイルや Secrets の整合性も併せてご確認ください。頑張っていきましょう 💪
