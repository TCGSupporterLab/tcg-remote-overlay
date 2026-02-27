# メモリ優先の状態管理への移行計画（修正版）

## 判明した課題
1.  **OverlayWidget のローカル同期漏れ**: `GroupBoundingBox` 経由で移動された際、ウィジェットの表示用座標 (`externalState`) は更新されますが、内部の `state` が更新されません。そのため、次にウィジェット単体で動かそうとした瞬間に、古い `state` の位置までジャンプしてしまいます。
2.  **App.tsx キャッシュ同期の漏れ**: ウィジェット単体で操作した際、そのウィジェットが「グループのアンカー」でない場合、`App.tsx` の `liveWidgetStatesRef` が更新されません。
3.  **無限ループの懸念**: `App.tsx` で `Maximum update depth exceeded` が発生しており、ステート更新の頻度を下げる必要があります。

## 修正内容

### OverlayWidget.tsx
- **内部ステートの同期**: `externalState` が変更された際、ウィジェットが操作中 (`isDragging` 等が false) でなければ、内部の `state` を `externalState` に同期する `useEffect` を追加します。
- **BroadcastChannel の厳密化**: 送信元の `senderId` チェックを強化し、自分自身の送信したメッセージを二重処理しないようにします。

### App.tsx
- **キャッシュ同期の全網羅**: `handleWidgetStateChange` において、グループの有無に関わらず、常に `liveWidgetStatesRef` を最新の状態に更新するようにします。
- **再レンダリングの最適化**: `setExternalStates` を呼び出す前に、実質的な値の変化（閾値以上）があるかを確認し、不要な `setState` を抑制します。特に `effectiveSelectionMembers` に関連する `useEffect` がループしていないか確認します。
- **タブ内同期**: `WIDGET_STATE_UPDATE` を受信した際、同じタブ内であっても `liveWidgetStatesRef` は更新するようにし、常にキャッシュを最新に保ちます。

### GroupBoundingBox.tsx
- ** manipulation 開始時の安全性**: `onManipulationStart` を呼ぶ直前に、最新の状態が `App.tsx` 側に反映されていることを確実にします。

## 検証計画
1.  **単体操作 -> グループ操作 -> 単体操作**: どの順序で行っても座標が飛ばないことを確認します。
2.  **エラーログの消失**: `Maximum update depth exceeded` が出力されないことを確認します。
3.  **複数ウィンドウ同期**: 同一タブ・別タブの両方で、タイムラグなく状態が同期されることを確認します。

