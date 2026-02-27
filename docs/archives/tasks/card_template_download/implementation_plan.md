# 実装計画: カード画像テンプレート配布機能の追加

カード画像の読み込みに使用するフォルダ構成のテンプレート（サンプルファイル込み）と、その詳細な説明ドキュメントをUIからダウンロードできるようにします。

## ユーザーレビューが必要な点
> [!IMPORTANT]
> - テンプレートの配布場所として、設定メニューの「操作説明（GuideTab）」タブの中に専用のダウンロードセクションを追加します。
> - ITリテラシーに依存せず誰でも内容がわかるよう、説明書ファイル名は `README` ではなく **`はじめにお読みください.txt`** とします。

## 変更内容

### 1. テンプレートアセットの作成
ユーザーがそのまま利用できる構成のテンプレートファイルを作成し、Viteが公開可能な `public/assets/templates/` ディレクトリに配置します。
遊戯王（Yu-Gi-Oh!）とホロライブ（hololive）の両方のサンプルを含めます。

#### [NEW] `public/assets/templates/card_image_template.zip` (またはフォルダ)
- **`はじめにお読みください.txt`** (初心者向けの丁寧な導入ガイド)
- `hololive/` (ホロライブOCG用サンプル)
    - `_meta_filter.json`
    - `_meta_card.json`
    - `master_library/` (実体) / `deck_example/` (仮想)
- `yu-gi-oh/` (遊戯王OCG用サンプル)
    - `_meta_filter.json`
    - `_meta_card.json`
    - `master_library/` (実体) / `deck_example/` (仮想)

### 2. UIの修正

#### [MODIFY] [GuideTab.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/SettingsMenu/GuideTab.tsx)
- 「セットアップ手順」セクションに、「テンプレート構成をダウンロード」ボタンを追加。
- ロードマップとして、「GUIによる直感的なデッキ構築機能」の構想について追記。

## 検証計画

### 自動テスト
- なし（UIの表示とリンクの有効性の確認が主目的のため）

### 手動検証
1. 設定メニューの「操作説明」タブを開き、新しいダウンロードボタンが表示されていることを確認。
2. ボタンをクリックし、テンプレート（またはZIP）が正しくダウンロードされることを確認。
3. ダウンロードしたガイドの内容が、今回確認した最新の仕様（`_meta_card.json` の階層自由度や `_link.txt` の意図）を反映していることを確認。
