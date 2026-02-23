# メモリ優先の状態管理への移行計画

現在の実装では、グループ操作や回転の開始時に `localStorage` から状態を読み込んでいますが、これは非同期の書き込み完了を待たずに読み込む可能性があり、座標が不連続にジャンプする原因となっていました。
これを解決するため、すべての操作においてメモリ上のキャッシュを正のデータソースとする方式に移行します。

## 提案される変更点

### App.tsx
- **`liveWidgetStatesRef` の導入**: 全ウィジェット (`card_widget`, `yugioh`, `dice`, `coin` 等) の最新の状態を保持する `useRef` を追加します。
- **キャッシュ同期ロジック**:
    - `handleWidgetStateChange` (自身のウィンドウでの操作終了時)
    - `BroadcastChannel` の `WIDGET_STATE_UPDATE` 受信時
    - これらすべてのタイミングで `liveWidgetStatesRef` を即座に更新します。
- ** manipulation 開始時の修正**: `handleManipulationStart` 内の `localStorage.getItem` ループを廃止し、`liveWidgetStatesRef.current` からスナップショットを作成するように変更します。

### GroupBoundingBox.tsx
- **`readAnchorState` の廃止**: `localStorage` を直接読みに行く関数を削除します。
- **データ供給の完全 Prop 化**: 必要な状態はすべて `App.tsx` から供給されるようにします。すでに `externalAnchorState` を追加済みですが、これを標準のデータソースとして位置づけます。

### OverlayWidget.tsx
- **localStorage の役割を固定**: `localStorage` は「ブラウザをリロードしたときの復帰用」に限定します。
- コンポーネント内の `useEffect` による `localStorage.setItem` は維持しますが、他コンポーネントがこれを「リアルタイムの通信路」として使うことを禁止します。

## 検証計画

### 1. 動作確認
- 複数オブジェクトを選択して移動した後、間髪入れずに回転操作を行い、座標がジャンプしないことを確認します。
- 別ウィンドウを並べ、一方での操作がもう一方に（`BroadcastChannel` 経由でキャッシュを更新して）正しく伝播することを確認します。

### 2. ログ確認
- `[MoveDebug]` `[RotateDebug]` における `Initial State` が、直前の操作の `Final State` と完全に一致することを確認します。
