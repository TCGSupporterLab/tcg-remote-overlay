# ZIPファイル支援機能の実装タスク

- [x] ZIPファイルサポートの基本設計と計画策定
- [x] `fflate` ライブラリのセットアップと `useLocalCards.ts` への統合
- [x] `unzipAndSave` 関数の実装
    - [x] フォルダ選択 (`showDirectoryPicker`)
    - [x] ZIP解凍とファイル順次書き込み
    - [x] Path Traversal セキュリティチェック
    - [x] 単一トップフォルダの自動調整（1段階剥ぎ取り）
- [x] `CardWidget.tsx` への UI 統合
    - [x] ドラッグ＆ドロップ対応（ZIP判定）
    - [x] 「ZIP展開して選択」ボタンの追加
- [x] 設定メニュー (`WidgetSections.tsx`) への UI 統合
    - [x] 「ZIP展開」ボタンの追加
- [x] プロップス伝搬の修正 (`App.tsx`, `SettingsMenu.tsx`, `WidgetsTab.tsx`)
- [x] 動作確認と最終調整
