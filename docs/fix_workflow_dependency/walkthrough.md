# 修正内容の確認 - GitHub Actions 依存関係の修正

## 変更内容
`.github/workflows/update-data.yml` において、Ubuntu 24.04 (noble) のパッケージ命名規則に合わせて以下の依存関係を更新しました：

- `libasound2` → `libasound2t64`
- `libgtk-3-0` → `libgtk-3-0t64`

これにより、`sudo apt-get install` が「パッケージが見つからない」というエラーで失敗する問題が解消されます。

## 検証方法
1. 修正内容を GitHub にプッシュします。
2. Actions タブから `Scheduled Data Update` ワークフローを手動実行（`workflow_dispatch`）し、`Install Puppeteer dependencies` ステップが正常に完了することを確認してください。
