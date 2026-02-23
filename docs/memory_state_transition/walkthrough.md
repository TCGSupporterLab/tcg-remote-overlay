# メモリ優先の状態管理への移行完了

## 実施した変更内容

### 1. App.tsx: ライブキャッシュ (`liveWidgetStatesRef`) の導入
- すべてのウィジェットの最新状態をメモリ上に保持する仕組みを構築しました。
- 操作終了時および `BroadcastChannel` 受信時にこのキャッシュを即座に更新します。
- `handleManipulationStart` で `localStorage` を一切読まず、このキャッシュからスナップショットを取得するように変更しました。

### 2. GroupBoundingBox.tsx: localStorage 依存の完全排除
- 自ら `localStorage` を見に行く `readAnchorState` 関数を廃止しました。
- `App.tsx` から供給される最新のキャッシュデータ (`externalAnchorState`) のみを計算の起点とするように整理しました。

### 3. 同期ロジックの安定化
- 各ウィンドウが通信時に `senderId` を付与し、自身の送信したメッセージを無視するように徹底しました。
- `handleTransientDrag` などのコールバックを安定化させ、無限ループの発生を抑制しました。

## 検証結果

### 動作確認
- 複数オブジェクトを移動した直後の回転操作において、座標が不連続に飛ぶ現象が解消されたことを確認しました。
- ウィンドウ間での同期が遅延なく行われることを確認しました。

### ログ確認
- `[App] Manipulation Start Snapshot` ログにおいて、常に最新の座標が取得されていることを確認しました。
