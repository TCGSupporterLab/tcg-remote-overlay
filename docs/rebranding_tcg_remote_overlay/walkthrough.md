# Walkthrough: リブランディング (TCG Remote Overlay)

## 実施された変更

### 1. コードベースの置換
- `App.tsx`: ドキュメントタイトル、ヘッダー、localStorageキー、BroadcastChannel名を更新。
- `useSharedState.ts`, `useCardSearch.ts`, `YugiohTools.tsx`, `OverlayWidget.tsx`: 同期用チャンネル名を一律 `tcg_remote_sync(_yugioh)` に変更。
- `localStorage` のマイグレーション: 新しいキー (`tcg_remote_`) がない場合でも、以前のキー (`remote_duel_`) からデータを引き継げるようフォールバック処理を実装しました。

### 2. プロジェクト設定の更新
- `package.json`: 名前に `tcg-remote-overlay` を設定。
- `vite.config.ts`: GitHub Pages用のベースパスを `/tcg-remote-overlay/` に更新。
- `index.html`: 初期読み込み時のタイトルを修正。

### 3. ドキュメントの整備
- `README.md`: 新リポジトリURLと名称を反映。
- 仕様書 (`docs/system_specifications/`): すべての「RemoteDuelTool」という呼称を「TCG Remote Overlay」へ統一。

## 次のステップ (GitHub操作)

コード側の準備は完了しました。以下の順序でGitHub側の設定変更をお願いします。

1. **GitHub組織名の変更**:
   - `github.com/RemoteDuelDev` にアクセス -> Settings -> Organization Name を `TCGSupporterLab` に変更。
2. **リポジトリ名の変更**:
   - リポジトリの Settings -> Repository Name を `tcg-remote-overlay` に変更。
3. **ローカルへの反映**:
   - 以下のコマンドを実行して、ローカルのGitが新URLを向くようにしてください。
     ```bash
     git remote set-url origin https://github.com/TCGSupporterLab/tcg-remote-overlay.git
     ```

これにより、商標問題を回避しつつ、より広い活動ができる環境が整います。
