# 実装計画: カード個別の識別ロジック修正

## 1. ユニークキーの導入 (`src/hooks/useCardSearch.ts`)
- ピン留めの判定に使用する `pinnedIds` を `pinnedUniqueKeys` に変更。
- キーの生成ルールを `${card.id}-${card.imageUrl}` とし、IDと画像の組み合わせでユニーク性を保証する。
- `togglePin` 関数の重複チェックとフィルタリング条件を、`id` と `imageUrl` の両方が一致する場合に変更。

## 2. コンポーネント間のデータ受け渡し修正
- `CardSearchContainer.tsx`
- `SearchTab.tsx`
- `PinnedTab.tsx`
- `CardGrid.tsx`
上記すべてのコンポーネントにおいて、`pinnedIds` を `pinnedUniqueKeys` に置換し、セット内の判定ロジックをユニークキー形式に更新。

## 3. 拡大表示（詳細ビュー）の修正
- `CardSearchContainer.tsx` 内の詳細ビューにおけるピン留め状態の判定も `${id}-${imageUrl}` 形式に更新。
