# 実装計画: SPマーカーの再配置と角丸ロジックの改善

## 1. 定数の分離と導入
- `HololiveTools.tsx` に `IMAGE_FOLLOW_OFFSET` と `TEXT_FOLLOW_OFFSET` を導入し、表示モードごとにマーカーの垂直位置を微調整できるようにする。
- ユーザーが角丸の強さを調整できるように `OVERLAY_CARD_RADIUS` を定義し、外部からも参照可能にする。

## 2. レンダリング構造の修正
- `overlay-card-frame` から `overflow-hidden` を削除し、SPマーカーを兄弟要素として外側に配置する。
- カードの中身（画像・テキスト）を包む内側のコンテナに `overflow-hidden` と `OVERLAY_CARD_RADIUS` を適用し、中身だけが角丸で切り抜かれるようにする。

## 3. 画像の境界線対策
- `.png` ファイル自体に含まれる微細なグレーの線を隠すため、`img` タグ自体にも直接 `OVERLAY_CARD_RADIUS` を適用する。
- 必要に応じて、等倍表示（`scale-100`）のままで境界ピクセルをトリミングする。

## 4. UIの統合
- `CardSearchContainer.tsx` （操作画面）の詳細表示エリアでも `OVERLAY_CARD_RADIUS` をインポートして適用し、アプリ全体でカードの見た目を統一する。
