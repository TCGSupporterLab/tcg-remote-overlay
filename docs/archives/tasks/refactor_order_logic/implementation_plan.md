# 表示順序ロジックのリファクタリング案

## 目的
`metadata.json` から抽出される表示順序情報 (`__order`) を、個別のカードデータに持たせるのではなく、アプリケーション全体のグローバル設定として扱うようにリファクタリングします。これにより、データ冗長性を排除し、メモリ使用量を削減します。

## 変更内容
- `useLocalCards.ts`: `metadata.json` から `__order` を抽出し、`metadataOrder` ステートとして公開。各カードへの属性付与を廃止。
- `useCardSearch.ts`: `useCardSearch` フックの引数に `orderInfo` を追加。受け取った順序情報に基づいて動的フィルタをソート。
- `App.tsx`: `useLocalCards` から順序情報を取得し、`CardSearchContainer` へ伝播。
- `CardSearchContainer.tsx`: 取得した順序情報を `useCardSearch` へ渡す。

## 検証プラン
- フィルタタブ（色、タイプ、Bloom）が意図した順序で並んでいるか確認。
- 各カテゴリ内のアイテムが `__order` の定義に従ってソートされているか確認。
