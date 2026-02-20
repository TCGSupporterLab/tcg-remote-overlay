# リブランディング実装計画書: TCG Remote Overlay

## 1. 概要
- **目的**: 商標リスク（Remote Duel）の回避、および汎用的なTCG支援ツールとしてのリブランディング。
- **新名称**: `TCG Remote Overlay`
- **新組織名**: `TCGSupporterLab`
- **リポジトリ名**: `tcg-remote-overlay`

## 2. 変更内容

### A. 表示名称の変更
- `Remote Duel Tool` -> `TCG Remote Overlay`
- `Remote Duel Overlay` -> `TCG Remote Overlay`

### B. 内部識別子の変更 (同期・保存)
同期の衝突を避け、クリーンな環境に移行するため、接頭辞を変更する。
- `remote_duel_sync` -> `tcg_remote_sync`
- `remote_duel_sync_yugioh` -> `tcg_remote_sync_yugioh`
- `remote_duel_*` (localStorage) -> `tcg_remote_*`
  - ※ 移行をスムーズにするため、古いキーがある場合はフォールバックとして読み込む処理を追加。

### C. プロジェクト設定の変更
- `package.json`: `name` を `tcg-remote-overlay` に変更。
- `vite.config.ts`: `base` を `/tcg-remote-overlay/` に変更（GitHub Pages用）。
- `index.html`: タイトルタグを更新。

### D. ドキュメントの更新
- `README.md`: タイトル、クローン用URL、説明文を更新。
- `docs/system_specifications/`: 全体の名称を更新。

## 3. 追加作業 (ユーザー側)
以下の手順はGitHub上での操作が必要なため、ユーザーに依頼する。
1. GitHub Organization の名称変更 (`RemoteDuelDev` -> `TCGSupporterLab`)
2. リポジトリ名の変更 (`RemoteDuelTool` -> `tcg-remote-overlay`)
3. ローカルの `git remote` の更新:
   ```bash
   git remote set-url origin https://github.com/TCGSupporterLab/tcg-remote-overlay.git
   ```
