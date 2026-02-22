# 実装計画：フィルタ表示の修正とUI整理

## 1. フィルタリングロジックの改善 (`useCardSearch.ts`)
- `dynamicFilterOptions` の更新：
    - 現在のパスにフィルタ定義がない場合、親フォルダを順次遡って `metadataOrder` を検索する。
    - 属性値の抽出範囲を `currentPath` 配下のカードのみに絞り込む。
- パスの正規化：
    - `setCurrentPath` において、バックスラッシュをスラッシュに置換する。

## 2. UIの整理 (`App.tsx`, `CardSearchContainer.tsx`)
- `App.tsx`：
    - 共通の `ScanningOverlay` コンポーネントを定義。
    - カード検索ビューにおいてのみオーバーレイを表示。
- `CardSearchContainer.tsx`：
    - 内部の重複したローディング表示コードを削除。
    - Props から `isScanning` を削除しシンプル化。

## 3. フィルタパネルの改善 (`FilterPanel.tsx`)
- フォルダ移動等で選択中のカテゴリが消えた場合、自動的に最初のカテゴリを選択し直すよう `useEffect` を追加。
