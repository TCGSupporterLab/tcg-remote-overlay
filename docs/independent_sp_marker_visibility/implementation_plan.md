# 実装計画: SPマーカー表示条件の分離

## 1. 表示ロジックの修正 (`src/components/HololiveTools.tsx`)
- 追従モード（follow）におけるSPマーカーのレンダリング条件を変更。
- これまで条件に含まれていた `isOverlayEnabled` (overlayMode === 'on') を除去。
- 修正後の条件: `spMarkerMode === 'follow' && !showSPMarkerForceHidden && overlayCard`
- これにより、メインのオーバーレイが非表示でも、選択されたカードがあればSPマーカーのみが表示されるようになる。

## 2. 独立モードの確認 (`src/App.tsx`)
- 独立モード（independent）におけるSPマーカーは、既にメインオーバーレイの状態を参照せずにレンダリングされていることを確認。
- したがって、追従モードの修正のみで目的の動作が達成される。
