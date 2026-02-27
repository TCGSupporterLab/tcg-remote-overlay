# 実装計画：ショートカットキーの拡充と一括リセット機能

## 1. ビデオソースの逆送り
- **目的**: ビデオソース（なし/カメラ/画面共有）をワンボタンで戻せるようにする。
- **実装**:
  - `App.tsx` の `toggleVideoSource` を修正し、`reverse` 引数を受け取れるようにする。
  - `handleKeyDown` で `Shift + V` を検知し、`reverse: true` で呼び出す。

## 2. プリセットのクイック切り替え
- **目的**: 設定画面を開かずに遊戯王モードとホロライブモードを切り替える。
- **実装**:
  - `App.tsx` の `handleKeyDown` で `Alt + 1` (Yu-Gi-Oh!) および `Alt + 2` (Hololive) を検知。
  - `useWidgetStore` の `setSettings` を呼び出して `activePreset` を変更する。

## 3. 全状態の一括リセット
- **目的**: 試合開始前などに全ての状態（LP、ダイス、コイン、SPマーカー）を一挙に初期化する。
- **実装**:
  - **Store**: `useWidgetStore` に `fullReset` を追加。内部で `BroadcastChannel` (`tcg_remote_sync_lp`) に `reset` イベントを飛ばす。
  - **LP計算機**: `LPCalculator.tsx` で `reset` イベントをハンドルし、`initialLP` に基づいて状態をリセットする。
  - **ショートカット**: `App.tsx` で `R` キーの長押し判定（3秒）を実装。`useRef` を使用してタイマーを管理し、`onKeyUp` でキャンセルできるようにする。
  - **UI**: 設定画面の「共通設定」内にリセットボタンを配置。

## 4. UIの再構成
- **目的**: よく使う「優先表示順」や新設の「リセット」にアクセスしやすくする。
- **実装**:
  - `WidgetsTab.tsx` のセクション順序を `共通設定` -> `汎用` -> `専用` に変更。
  - 共通設定内の項目順を `状態リセット` -> `優先表示順` に変更。
