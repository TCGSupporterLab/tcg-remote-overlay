# コードベースおよびドキュメントのクリーンアップ

## 完了したタスク
- [x] `docs/` 直下の過去ログフォルダを `docs/archives/tasks/` へ退避
- [x] 不要な設計ドキュメント (`next_generation_architecture_design.md`) の削除
- [x] 不要なGitHub Workflow (`update-data.yml`) の削除
- [x] `scripts/` を `tools/` へリネームし、個人用ツールとして隔離
- [x] `src/data/` から個人用データ (`hololive-cards.json`, `kana-dictionary.json`) を `tools/data/` へ移動
- [x] `tools/` 内の全スクリプトのパス参照を修正
- [x] `README.md` の記述を現在の仕様（ローカルフォルダ読み込み）に合わせて更新
- [x] 未使用コード (`useWidgetSettings.ts`) および未使用定数の削除
- [x] `.gitignore` および `package.json` の整理
- [x] システム仕様書の矛盾解消およびアーカイブ方針の追記
