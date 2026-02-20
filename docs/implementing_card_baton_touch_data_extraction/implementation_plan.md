# バトンタチE��惁E��の抽出と表示の実裁E��画

ホロメンおよびBuzzホロメンカードに含まれる「バトンタチE��」コスト情報を抽出し、オーバ�Eレイ画面で表示できるようにします、E

## 課顁E
- `hololive-cards.json` に「バトンタチE��」�E惁E��が含まれてぁE��ぁE��E
- オーバ�Eレイ画面でバトンタチE��コスト（交代に忁E��なコスト）が確認できなぁE��E

## 変更冁E��

### 1. スクレイパ�Eの更新 ([fetch-hololive-data.js](file:///f:/dev/github/tcg-remote-overlay/scripts/fetch-hololive-data.js))
- `parseCardsFromPage` および AJAX レスポンスの解析部刁E�� `batonTouch` フィールドを追加します、E
- `getDdAlt('バトンタチE��')` を使用して、アイコンの `alt` チE��スト（例：「◇」）を抽出します、E
- カードデータオブジェクト�E初期値に `batonTouch: ''` を追加します、E

### 2. チE�Eタ更新と検証
- `DEV=true` モードでスクレイパ�Eを実行し、キャチE��ュ済みのHTMLからチE�Eタを�E抽出します、E
- `hololive-cards.json` 冁E�Eホロメンカードに `batonTouch` フィ録が追加されてぁE��ことを確認します、E

### 3. オーバ�Eレイ UI の更新 ([HololiveTools.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/HololiveTools.tsx))
- カード詳細オーバ�Eレイの下部�E�EP付近また�Eタグの隣�E�にバトンタチE��コストを表示します、E
- コストアイコン�E�◇めE��色�E�を適刁E��レンダリングします、E
- ホロメンおよびBuzzホロメンカード�E場合、コストが空であっても頁E��を常に表示し！Eと表示�E�、情報の網羁E��を担保します、E
- バトンタチE��が存在しなぁE��ード（サポ�Eトカード等）では表示をスキチE�Eします、E

### 4. サイコロ配置の調整 ([HololiveTools.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/HololiveTools.tsx))
- サイコロのオーバ�EレイコンチE��から余�Eなパディングとマ�Eジンを削除します、E
- カード枠の最上部�E�非回転時）また�E最下部�E�回転時）に寁E��して表示されるよぁE��配置を最適化します、E

### 5. GitHub Actions の設定更新 ([update-data.yml](file:///f:/dev/github/tcg-remote-overlay/.github/workflows/update-data.yml))
- GitHub 上での実行時に常に最新チE�Eタを取得するため、`DEV: false` 環墁E��数を�E示皁E��設定します、E

## 検証プラン

### 自動テスチE/ スクリプト
- `DEV=true node scripts/fetch-hololive-data.js` を実行し、エラーなく終亁E��ること、E

### 手動検証
- コントローラーでホロメンカード、Buzzホロメンカードを選択し、オーバ�Eレイに「バトンタチE��」�Eコストアイコンが表示されることを確認する、E
- サポ�Eトカードや推し�Eロメン�E�バトンタチE��がなぁE��の�E�で表示が崩れたり不要な頁E��が�EなぁE��とを確認する、E


