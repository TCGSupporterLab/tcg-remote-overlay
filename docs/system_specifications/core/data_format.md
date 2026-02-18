# カードデータ形式仕様 (Card Data Format)

## 1. ホロライブカードデータ (`hololive-cards.json`)

ホロライブOCGのカードデータは、以下の構造を持つオブジェクトの配列として保存されます。

### フィールド定義

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | `string` | カード番号 (例: `hBP01-001`) |
| `name` | `string` | カード名 |
| `cardType` | `string` | カードタイプ |
| `rarity` | `string` | レアリティ (OSR, RR, R, U, C, etc.) |
| `color` | `string` | 色 (赤, 青, 黄, 緑, 紫, 白, 無) |
| `hp` | `string` | HPまたはLIFEの値 |
| `bloomLevel` | `string` | Bloomレベル (Debut, 1st, 2nd, Spot, etc.) |
| `tags` | `string` | タグ (所属、特徴など。スペース区切り) |
| `expansion` | `string` | 収録商品名 |
| `imageUrl` | `string` | **ローカル環境**の画像パス (`/images/cards/filename.png`) |
| `originalImageUrl` | `string` | **公式サイト**のオリジン画像URL (デバッグ・再取得用) |
| `oshiSkills` | `array` | 推しスキルの配列。各要素に `label`, `name`, `cost`, `text` を含む |
| `arts` | `array` | アーツの配列。各要素に `name`, `costs`, `damage`, `tokkou`, `text` を含む |
| `keywords` | `array` | キーワード能力の配列。各要素に `type`, `name`, `text` を含む |
| `abilityText` | `string` | サポートカード等の能力テキスト |
| `extra` | `string` | デッキ制限やBuzzペナルティ等の注釈テキスト |
| `batonTouch` | `string` | バトンタッチ（交代）コスト (赤, 青, 黄, 緑, 紫, 白, ◇, または空) |
| `limited` | `boolean` | LIMITEDカードかどうかの判定フラグ |
| `kana` | `string` | 検索用のひらがな読み (自動生成・辞書ベース) |

### 運用ルール
- **`imageUrl`**: 常に `/images/cards/` プレフィックスを持ち、ブラウザから直接参照可能なパスを保持します。
- **`originalImageUrl`**: `scripts/fetch-hololive-data.js` 実行時に取得され、`scripts/download-images.js` がローカルに保存する際のソースとして利用されます。

## 2. かな辞書データ (`kana-dictionary.json`)

検索用の「かな読み」を管理するマッピングデータです。

### 構造
`{ "漢字・英語の単語": "ひらがな読み" }` の形式を持つシンプルなキー・バリューオブジェクトです。

### メンテナンス
- 編集は `scripts/merge-dicts.js` 内の `MANUAL_ADDITIONS` に対して行います。
## 3. 静的リソース (Static Resources)
 
 ### 3.1. カラータイプ・エネルギーアイコン
 UIで使用される各種属性アイコンは `/public/images/icons/` に配置されます。
 
 | 種類 | ファイル名形式 | 説明 |
 | :--- | :--- | :--- |
 | **カードタイプ** | `type_{color}.png` | レベルや種別とともに表示。多色は `type_blue_red.png` 等。 |
 | **エネルギー** | `arts_{color}.png` | アーツコストやバトンタッチコストとして表示。 |
 
 ### 3.2. アイコンの自動収集
 - `scripts/download-type-icons.js` を使用して、`hololive-cards.json` に含まれる色の組み合わせ（多色含む）を走査。
 - ローカルに存在しないアイコンがある場合、公式サイトから自動的にダウンロードして保存します。
 - **GitHub Actions**: 毎日のデータ更新ワークフロー (`update-data.yml`) 内でこのスクリプトが実行され、新カード登場時に必要なアイコンも自動的にリポジトリに追加されます。
