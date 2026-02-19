# RemoteDuelTool システム仕様書

## 概要
RemoteDuelToolは、リモート環境でのカードゲーム対戦をサポートするためのWebアプリケーションです。
ライフポイントの管理、ダイス・コインのシミュレーション、カードデータの検索、およびOBS等の配信ソフトに統合するためのオーバーレイ機能を提供します。

## ドキュメント構成

### 1. [コアシステム仕様 (Core System)](./core/overlay_system.md)
- オーバーレイ同期（BroadcastChannel）
- 背景モード（Normal / Green / **Video背景**）
- ビデオ調整（ズーム、パン、トリミング同期）
- データの永続化とリセット、ウィンドウ管理
- [ホロライブデータ開発ルール (Data Development Rule)](./core/hololive_data_development_rule.md)
- [カードデータ形式仕様 (Card Data Format)](./core/data_format.md)

### 2. [ホロライブOCGツール仕様 (Hololive Toolset)](./features/hololive_toolset.md)
- カード検索エンジン（正規化、ひらがな対応、複数条件フィルタ）
- ピン留め機能（最大100枚制限）
- ライフポイント管理とオーバーレイ同期

### 3. [遊戯王ツール仕様 (Yu-Gi-Oh! Toolset)](./features/yugioh_toolset.md)
- ライフポイント管理（P1/P2）
- 計算機機能と履歴（Undo/Redo）
- ショートカットキー操作、ログ記録

### 4. [共通ツール仕様 (Common Tools)](./features/common_tools.md)
- ダイスロール（3Dアニメーション）
- コインタス（3Dアニメーション）
- デジタルディスプレイ（ネオンエフェクト）
