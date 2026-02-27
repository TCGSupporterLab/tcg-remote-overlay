# 実装計画: 読み仮名インデックスの統合

## 1. 型定義の更新 (`src/hooks/useCardSearch.ts`)
- `Card` インターフェースに `kana?: string;` を追加し、JSONデータの読み仮名フィールドを参照できるようにする。

## 2. 検索用インデックスの生成ロジック修正
- `useMemo` 内の `normalizedData` 生成処理を修正。
- `card.name` だけでなく `card.kana` も `normalizeText` （カタカナ化・正規化）に通す。
- `combinedNorm` として、名前と読み仮名を連結した文字列を作成。
- 連結した文字列をベースに `_normName` (カタカナ) や `_hiraName` (平仮名) を生成する。

## 3. 動作の仕組み
- 例: 名前「Kotori」、読み「ことり」のカード
  - `_normName` -> "kotori コトリ"
  - `_hiraName` -> "kotori ことり"
- これにより、ユーザーが「kotori」と打っても「ことり」と打っても、あるいは「とり」と打っても部分一致でヒットするようになる。
