# 実装計画: SPマーカー表示切り替えと自動リセット

## 1. 状態管理の拡張 (`src/hooks/useCardSearch.ts`)
- `sharedState` に `showSPMarkerForceHidden` (boolean, 初期値 false) を追加。
- `BroadcastChannel` を介して、操作画面とオーバーレイ画面間でこのフラグを同期。
- `showSPMarkerForceHidden` は `localStorage` への保存対象から除外し、メモリ上でのみ管理する。

## 2. リセット機能の実装
- `useCardSearch.ts` の `updateShared` 関数内で、`spMarkerMode` が変更された際に `showSPMarkerForceHidden` を `false` にリセット。
- オーバーレイ画面が起動し `REQ_STATE` をメイン画面に送信した際、メイン画面側でフラグを `false` にリセットし、最新のクリーンな状態で同期を開始。

## 3. ショートカットキーの実装 (`src/App.tsx`)
- `handleKeyDown` ハンドラ内に 'O' キー（または 'o'）の判定を追加。
- ホロライブモード時にのみ `toggleSPMarkerForceHidden` を呼び出す。

## 4. 表示ロジックの修正
- `src/components/HololiveTools.tsx` (追従モード) と `src/App.tsx` (独立モード) の両方において、マーカーの表示条件に `!showSPMarkerForceHidden` を追加。

## 5. UIの更新 (`src/components/CardSearch/SPMarkerBadge.tsx`)
- バッジの `title` 属性を更新し、`(Oキーで強制表示/非表示)` という案内を追加。
