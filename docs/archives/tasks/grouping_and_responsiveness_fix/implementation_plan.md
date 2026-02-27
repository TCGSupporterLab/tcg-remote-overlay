# 実装計画: グループ化と操作レスポンスの改善

## 1. 同期無視フラグの即時リセット
- `App.tsx`: `manipulationNonce` ステートを導入。
- `handleManipulationStart`: Nonce をインクリメント。
- `OverlayWidget.tsx`: `parentManipulationNonce` プロップを追加。`useEffect` で Nonce の変更を検知し、`ignoreExternalSyncRef` を `false` にリセット。

## 2. 複数選択時の UI 整理
- `App.tsx`: `GroupBoundingBox` のループ内で、`selectedWidgetIds.size > 1` かつ自身の ID が選択されている場合、個別枠を非表示（null を返す）にするロジックを追加。

## 3. コインウィジェットの修正
- `App.tsx`: コインウィジェットの `externalState` プロップに渡す値を `externalStates['coin']` に修正。

## 4. JSX 構文エラーの修正
- 不整合な `</div>` タグを削除し、適切な構造に修正。
