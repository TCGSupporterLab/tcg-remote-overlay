# メモリ優先の状態管理への移行タスク

- [x] 実装計画の作成とユーザー承認 (@[/ask] ワークフローに準拠)
- [x] `App.tsx` に全ウィジェットの最新状態を保持する `liveWidgetStatesRef` を実装
- [x] ウィジェットの状態変更 (`handleWidgetStateChange`) 時にキャッシュを更新する仕組みの構築
- [x] `BroadcastChannel` からの受信時にキャッシュを更新する仕組みの構築
- [x] `handleManipulationStart` で `localStorage` ではなくキャッシュを使用するように修正
- [x] `GroupBoundingBox.tsx` の `readAnchorState` を廃止し、Props 経由のデータのみを使用するように修正
- [x] `OverlayWidget.tsx` からの `localStorage` 読み込み箇所の精査 (初期化時のみに制限)
- [x] 座標ジャンプの根本原因の追加修正
    - [x] `OverlayWidget.tsx`: `externalState` から内部 `state` への同期実装
    - [x] `App.tsx`: 単体操作時の `liveWidgetStatesRef` 同期漏れの修正
    - [x] `App.tsx`: 無限ループ (`Maximum update depth exceeded`) の解消と最適化
- [/] 動作検証と副作用の確認
- [ ] デバッグログの整理
