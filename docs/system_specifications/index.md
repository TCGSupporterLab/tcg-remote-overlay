# TCG Remote Overlay システム仕様書

## 概要
TCG Remote Overlayは、リモート環境でのカードゲーム対戦をサポートするためのWebアプリケーションです。
ライフポイントの管理、ダイス・コインのシミュレーション、カードデータの検索、およびOBS等の配信ソフトに統合するためのオーバーレイ機能を提供します。

## ドキュメント構成

### 1. [コアシステム仕様 (Core System)](./core/overlay_system.md)
- オーバーレイ同期（BroadcastChannel）
- 背景モード（Normal / Green / **Video背景**）
- ビデオ調整（ズーム、パン、トリミング同期）
- 表示優先順位管理（ドラッグ＆ドロップによるZ-Index調整）
- **マイレイアウト機能（配置の保存・復元、JSON入出力、デフォルト配置自動読み込み）**
- **誤操作防止（Action Shield）と入力遮断（Interaction Exclusion）**
- データの永続化とリセット、ウィンドウ管理
- [ホロライブデータ開発ルール (Data Development Rule)](./core/hololive_data_development_rule.md)
- [カードデータ形式仕様 (Card Data Format)](./core/data_format.md)

### 2. [カード検索 & SPマーカー仕様 (Card Search & SP Marker)](./features/hololive_toolset.md)
- カード検索エンジン（正規化、ひらがな対応、複数条件フィルタ）
- ピン留め機能（最大1,000枚制限）とドラッグ＆ドロップ並び替え
- 独立カードウィジェットとShift+数字キーによる高速切替
- SPマーカーの状態管理と表示

### 3. [ライフ計算機仕様 (LP Calculator Widget)](./features/yugioh_toolset.md)
- ライフポイント管理（P1/P2）
- 計算機機能と履歴（Undo/Redo）
- ショートカットキー操作、ログ記録、反転設定

### 4. [共通ツール仕様 (Common Tools)](./features/common_tools.md)
- ダイスロール（3Dアニメーション）
- コインタス（3Dアニメーション）
- デジタルディスプレイ（ネオンエフェクト）
