# TCG Remote Overlay システム仕様書

## 概要
TCG Remote Overlayは、リモート環境でのカードゲーム対戦をサポートするためのWebアプリケーションです。
ライフポイントの管理、ダイス・コインのシミュレーション、カードデータの検索、およびOBS等の配信ソフトに統合するためのオーバーレイ機能を提供します。

## ドキュメント構成

### 1. [コアシステム仕様 (Core System)](./core/overlay_system.md)
- オーバーレイ同期（BroadcastChannel）
- 背景モード（Normal / Green / **映像背景**）
- 映像調整（ズーム、パン、トリミング同期）
- 表示優先順位管理（ドラッグ＆ドロップによるZ-Index調整）
- **マイレイアウト機能（配置・映像調整の保存・復元、「他を隠す」機能、JSON入出力、デフォルト配置自動読み込み）**
- **誤操作防止（Action Shield）と入力遮断（Interaction Exclusion）**
- データの永続化とリセット、ウィンドウ管理
- [ローカルデータ開発ルール (Local Data Development Rule)](./core/local_data_development_rule.md)
- [カードデータ形式仕様 (Card Data Format)](./core/data_format.md)

### 2. [カード検索 & SPマーカー仕様 (Card Search & SP Marker)](./features/card_and_sp_marker.md)
- カード検索エンジン（正規化、ひらがな対応、複数条件フィルタ）
- **2つの表示モード（Simple/Library）とD&Dによる自動遷移**
- ピン留め機能（最大1,000枚制限）とドラッグ＆ドロップ並び替え
- **フォルダキャッシュ（過去の作業状態の自動復元）**
- 独立カードウィジェットとShift+数字キーによる高速切替
- SPマーカーの状態管理と表示

### 3. [ライフ計算機仕様 (LP Calculator Widget)](./features/lp_calculator_widget.md)
- ライフポイント管理（P1/P2）
- 計算機機能と履歴（Undo/Redo）
- ショートカットキー操作、ログ記録、反転設定

### 4. [共通ツール仕様 (Common Tools)](./features/dice_and_coin.md)
- ダイスロール（3Dアニメーション）
- コインタス（3Dアニメーション）
- デジタルディスプレイ（ネオンエフェクト）

### 5. メンテナンスとアーカイブ
- **過去ログの管理**: `docs/` 直下のタスク用フォルダは、完了後に `docs/archives/tasks/` へ移動して整理されます。
- **個人用ツールの分離**: `tools/` および `hololive-cards.json` は個人・テスト用であり、Git管理および配布パッケージから除外されています。
