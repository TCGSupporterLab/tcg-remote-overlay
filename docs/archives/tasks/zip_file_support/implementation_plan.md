# ZIPファイル支援機能の実装計画

カードウィジェットにZIPファイルをドラッグ＆ドロップ、またはボタンから選択することで、指定したローカルフォルダに展開し、そのままライブラリとして使用できるようにします。

## ユーザーレビュー必須

> [!IMPORTANT]
> - ZIP展開のために外部ライブラリ `fflate` を導入します。
> - 直接メモリに展開するのではなく、一度ローカルフォルダを選択して書き出すステップが加わります（ブラウザのセキュリティ制限およびユーザー要望に基づく）。
> - 展開対象のフォルダを選択するダイアログが表示されます。

## 提案される変更

### [Component] データ処理ロジック

#### [MODIFY] [useLocalCards.ts](file:///f:/dev/github/tcg-remote-overlay/src/hooks/useLocalCards.ts)
- ZIPファイルを展開するための `unzipAndSave` 関数（仮）を追加。
- セキュリティ対策（Path Traversal, Zip Bomb）を実装。
- 階層構造の自動調整（1つ余計な階層がある場合にストリップする機能）を実装。

### [Component] UI

#### [MODIFY] [CardWidget.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/CardSearch/CardWidget.tsx)
- 未接続時の画面に「ZIPファイルを展開して選択」ボタンを追加。
- `.zip` ファイルのドラッグ＆ドロップを認識し、展開処理へ誘導。

#### [MODIFY] [WidgetSections.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/SettingsMenu/WidgetSections.tsx)
- 「フォルダを選択」ボタンの横に「ZIPファイルを展開して選択」ボタンを追加。

#### [MODIFY] [App.tsx](file:///f:/dev/github/tcg-remote-overlay/src/App.tsx)
- UIからのZIP展開要求を `useLocalCards` に中継し、展開後のフォルダハンドルを `scanDirectory` に渡す。

## セキュリティ対策
- **Path Traversal**: ZIP内のファイル名に含まれる `..` や絶対パスを排除し、選択されたターゲットフォルダ外に書き込まれないようにします。
- **Zip Bomb**: 展開前のサイズチェックおよびファイル数制限を設け、リソースを枯渇させないようにします。

## 階層構造の自動調整（スマート調整）
- ZIP内のファイルパスを解析し、アプリが正常にカードを認識できる「3階層（OCG/Set/Card）」になるように自動調整します。

### 判定ルール：
1. ZIP内の画像ファイル（.png, .jpg等）のパス階層を調べます。
2. もしパスが **4階層** 以上（例：`wrapper/hololive/set1/001.png`）だった場合、トップの `wrapper` フォルダを無視して展開します。
3. もしパスが既に **3階層** （例：`hololive/set1/001.png`）だった場合は、**何もしません**。
   - これにより、ご指摘いただいた「`hololive` 1つしかない場合」でも、`hololive` が消えてしまう事態を防ぎ、正しく `hololive/set/card` として展開されます。

## 検証プラン

### 自動テスト
- 現在プロジェクトに自動テスト環境がないため、手動検証を優先します。

### 手動検証
1. **D&D検証**: カードウィジェットに通常の画像をD&D（既存機能維持）→ ZIPをD&D（新規機能動作確認）。
2. **ボタン検証**: 設定メニュー、およびウィジェット上のボタンからZIPを選択。
3. **階層構造検証**: 
   - 階層なし（直下に画像）のZIPを展開。
   - 1階層あり（`folder/image.png`）のZIPを展開し、ターゲット直下に `image.png` が来ることを確認。
4. **セキュリティ検証**: `..` を含む悪意のあるZIPを作成し、展開が拒否されることを確認。
