# ガジェット結合機能 仕様書 & 実装ガイドライン

## 1. 要件定義 (Requirements)

### 1.1. 概要
複数の独立したガジェット（Dice, Coin, Card 等）を選択し、一つの「グループ」として扱えるようにする機能。グループ化されたガジェットは、位置関係を維持したまま一括で移動できる。

### 1.2. 必須機能
- **複数選択**: クリックによる個別選択およびドラッグ（矩形選択）による一括選択。
- **結合（グループ化）**: 選択中のガジェットを親子関係で紐付け、`WidgetGroup` を生成する。
- **永続化**: グループ化された状態を `localStorage` に保存し、リロード後も維持する。
- **UI 統合**: `SettingsMenu` のガジェットタブから結合操作を行えるようにする。

## 2. 実装仕様 (Technical Specification)

### 2.1. データ構造
- **OverlayWidget**: 各ガジェットは唯一の `instanceId` (UUID) を持つ。
- **WidgetRelation**:
  ```typescript
  interface WidgetRelation {
    id: string; // instanceId
    parentId: string | null;
    childIds: string[];
    transform: { x: number, y: number, rotation: number }; // 親からの相対座標
  }
  ```

### 2.2. グループ化ロジック (App.tsx)
1. 選択された全ガジェットの境界矩形 (Bounding Box) を計算する。
2. 境界矩形の中心をグループの座標とする。
3. 新しい `WidgetGroup` インスタンスを作成する。
4. 各子ガジェットの座標をグループの中心からの相対座標に変換する。
5. `relation` を更新し永続化する。

## 3. 発生した問題と注意点 (Lessons Learned)

### 3.1. JSX 構造の複雑化
- **問題**: `SettingsMenu.tsx` が 900 行を超える巨大なファイルになっており、JSX の閉じタグや条件分岐 (`{... && (...) }`) の入れ子が深く、修正時に構文エラー (`Adjacent JSX elements`) が発生しやすい。
- **対策**: 今後は機能を小さなコンポーネントに分割してから実装することを強く推奨する。

### 3.2. ファイル操作とエンコーディング
- **問題**: `multi_replace_file_content` や PowerShell による自動修正において、日本語文字列の文字化けが発生した。これは Shift-JIS と UTF-8 の混在や、書き込み時の BOM の有無に起因する。
- **対策**: 
  - ファイルは常に **UTF-8 (BOMなし)** で保存する。
  - PowerShell を使用する場合は、`System.Text.UTF8Encoding($False)` を明示して書き込む。

### 3.3. 未完了のタスク
- 分解機能 (Ungroup)
- テンプレート保存・復元機能
- グループ内での自由な再配置の座標計算

---
このドキュメントは、実装を一旦リセットするにあたり、これまでの知見を保存するために作成されました。
