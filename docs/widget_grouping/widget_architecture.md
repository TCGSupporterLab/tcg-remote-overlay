# Widget System Architecture

## 概要
本プロジェクトでは、画面上の操作可能な各要素（ガジェット）を `OverlayWidget` でラップし、座標・回転・拡縮を統一的に管理しています。

## 各ウィジェットの役割

### 1. カードウィジェット (`card_widget`)
- **役割**: カードの検索、および選択したカードの常駐表示。
- **実装**: `CardWidget.tsx` を使用。
- **経緯**: かつては `HololiveTools` という名前でカード表示を行っていましたが、現在は検索機能と統合された `CardWidget` がその役割（カードの表示そのもの）を担っています。
- **注意**: `pinnedCards` 配列を `App.tsx` レベルで `map` する古い形式は廃止されました。現在は `CardWidget` 内部、あるいはこの独立したウィジェットがカード表示の主軸です。

### 2. ダイス・コインウィジェット (`dice`, `coin`)
- **役割**: ダイスロールおよびコインフリップの表示。
- **実装**: `OverlayDisplay.tsx` を通じて `ThreeDDice`, `ThreeDCoin` を表示。

### 3. モード固有ウィジェット
- **YugiohTools (`yugioh`)**: ライフポイント計算機。
- **SPMarkerWidget (`hololive_sp_marker`)**: ホロライブOCG用のSPマーカー。

## グループ化と一括操作のロジック
- **正式な結合 (Groups)**: `groupData.groups` に保存され、永続的に一緒に動きます。
- **一時的な選択 (Transient Selection)**: 複数選択（Ctrl+クリック等）時に動的に計算される「仮想的なグループ」です。
- **操作ハンドル**:
  - 単一選択時: 各ウィジェットの個別のハンドルを表示。
  - 複数選択時: 個別ハンドルを隠し、全体を包む `GroupBoundingBox` を表示して一括操作（移動・回転・拡縮）を行います。
