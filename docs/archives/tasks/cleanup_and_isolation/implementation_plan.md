# 実装計画: クリーンアップと隔離

## 1. フォルダ構成の変更
- `docs/` 内の非仕様書フォルダを `docs/archives/tasks/` に移動する。
- `scripts/` を `tools/` に変更し、アプリ本体から論理的に分離する。

## 2. データの隔離
- `src/data/` にある大規模なJSONファイルを `tools/data/` に移動し、`.gitignore` で除外する。
- `tools/` 内のスクリプトが新しいパスで動作するように `path.join` 部分を一括置換する。

## 3. 不要な依存の排除
- `package.json` から、スクレイピングや画像加工にしか使わない `puppeteer`, `sharp`, `tesseract.js` を削除する。
- `npm run update-data` 等の古いスクリプトコマンドを削除する。

## 4. ドキュメントの整合性確保
- `README.md` の「特徴」セクションから、内蔵カード枚数の記述を削除する。
- 仕様書 (`overlay_system.md`) の記述ミス（重複）を修正する。
