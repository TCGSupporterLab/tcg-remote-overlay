# タスク: カメラ選択機能の実装

使用者が複数接続されているカメラを切り替えられるように、カメラデバイスの選択機能を実装する。

## ステータス
- [x] Zustandストアにカメラ関連の状態を追加
- [x] VideoBackgroundコンポーネントでデバイス一覧を取得・利用するロジックを実装
- [x] 設定メニュー（VideoTab）にデバイス選択UIを追加
- [x] VideoBackgroundの非アクティブ状態（起動前）にデバイス選択UIを追加
- [x] 全体的な動作確認と不整合の修正

## 修正ファイル
- `src/store/useWidgetStore.ts`: 状態管理の追加
- `src/components/VideoBackground.tsx`: ストリーム取得ロジックとプレビューUIの修正
- `src/components/SettingsMenu/VideoTab.tsx`: 設定UIの追加
- `src/components/SettingsMenu.tsx`: Propの橋渡し
- `src/App.tsx`: ストアと各コンポーネントの連携
