# 実装計画: ダブルクリックによるピン留め

## 1. カードグリッド項目の修正 (`src/components/CardSearch/CardGrid.tsx`)
- `CardItem` コンポーネントのメイン `div` に `onDoubleClick={() => onPin(card)}` を追加。
- これにより、検索結果とピン留めリストの両方でダブルクリックが有効になる。

## 2. 拡大表示エリアの修正 (`src/components/CardSearch/CardSearchContainer.tsx`)
- 左側の詳細ビュー内の画像コンテナに `onDoubleClick` ハンドラを追加。
- ユーザーが画像をダブルクリックすると、現在選択されているカードのピン留め状態が切り替わるようにする。
- 視覚的なフィードバックとして、画像エリアに `cursor-pointer` クラスを追加。
