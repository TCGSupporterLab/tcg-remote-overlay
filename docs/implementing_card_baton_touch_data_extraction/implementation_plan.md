# バトンタッチ情報の抽出と表示の実装計画

ホロメンおよびBuzzホロメンカードに含まれる「バトンタッチ」コスト情報を抽出し、オーバーレイ画面で表示できるようにします。

## 課題
- `hololive-cards.json` に「バトンタッチ」の情報が含まれていない。
- オーバーレイ画面でバトンタッチコスト（交代に必要なコスト）が確認できない。

## 変更内容

### 1. スクレイパーの更新 ([fetch-hololive-data.js](file:///f:/dev/github/RemoteDuelTool/scripts/fetch-hololive-data.js))
- `parseCardsFromPage` および AJAX レスポンスの解析部分に `batonTouch` フィールドを追加します。
- `getDdAlt('バトンタッチ')` を使用して、アイコンの `alt` テキスト（例：「◇」）を抽出します。
- カードデータオブジェクトの初期値に `batonTouch: ''` を追加します。

### 2. データ更新と検証
- `DEV=true` モードでスクレイパーを実行し、キャッシュ済みのHTMLからデータを再抽出します。
- `hololive-cards.json` 内のホロメンカードに `batonTouch` フィ録が追加されていることを確認します。

### 3. オーバーレイ UI の更新 ([HololiveTools.tsx](file:///f:/dev/github/RemoteDuelTool/src/components/HololiveTools.tsx))
- カード詳細オーバーレイの下部（HP付近またはタグの隣）にバトンタッチコストを表示します。
- コストアイコン（◇や各色）を適切にレンダリングします。
- ホロメンおよびBuzzホロメンカードの場合、コストが空であっても項目を常に表示し（0と表示）、情報の網羅性を担保します。
- バトンタッチが存在しないカード（サポートカード等）では表示をスキップします。

### 4. サイコロ配置の調整 ([HololiveTools.tsx](file:///f:/dev/github/RemoteDuelTool/src/components/HololiveTools.tsx))
- サイコロのオーバーレイコンテナから余分なパディングとマージンを削除します。
- カード枠の最上部（非回転時）または最下部（回転時）に密着して表示されるように配置を最適化します。

### 5. GitHub Actions の設定更新 ([update-data.yml](file:///f:/dev/github/RemoteDuelTool/.github/workflows/update-data.yml))
- GitHub 上での実行時に常に最新データを取得するため、`DEV: false` 環境変数を明示的に設定します。

## 検証プラン

### 自動テスト / スクリプト
- `DEV=true node scripts/fetch-hololive-data.js` を実行し、エラーなく終了すること。

### 手動検証
- コントローラーでホロメンカード、Buzzホロメンカードを選択し、オーバーレイに「バトンタッチ」のコストアイコンが表示されることを確認する。
- サポートカードや推しホロメン（バトンタッチがないもの）で表示が崩れたり不要な項目が出ないことを確認する。
