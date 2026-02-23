# メモリ優先の状態管理への移行タスク

- [ ] 実装計画の作成とユーザー承認 (@[/ask] ワークフローに準拠)
- [ ] `App.tsx` に全ウィジェットの最新状態を保持する `liveWidgetStatesRef` を実装
- [ ] ウィジェットの状態変更 (`handleWidgetStateChange`) 時にキャッシュを更新する仕組みの構築
- [ ] `BroadcastChannel` からの受信時にキャッシュを更新する仕組みの構築
- [ ] `handleManipulationStart` で `localStorage` ではなくキャッシュを使用するように修正
- [ ] `GroupBoundingBox.tsx` の `readAnchorState` を廃止し、Props 経由のデータのみを使用するように修正
- [ ] `OverlayWidget.tsx` からの `localStorage` 読み込み箇所の精査 (初期化時のみに制限)
- [ ] 複数ウィンドウ間での同期および、移動・回転の精度検証
- [ ] デバッグログの整理
