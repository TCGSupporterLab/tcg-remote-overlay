# 修正計画 - GitHub Actionsのライブラリ依存関係の修正

## 概要
Ubuntu 24.04 (noble) へのランナー環境の移行に伴い、一部のパッケージ名が変更されたため、`update-data.yml` ワークフローが失敗しています。
具体的には `libasound2` および `libgtk-3-0` が `t64` サフィックスを必要とするようになっています。

## 修正内容
1. `.github/workflows/update-data.yml` の `Install Puppeteer dependencies` ステップを更新します。
   - `libasound2` を `libasound2t64` に変更
   - `libgtk-3-0` を `libgtk-3-0t64` に変更

## 確認事項
- 修正後、ワークフローを `workflow_dispatch` で手動実行して成功することを確認します。
