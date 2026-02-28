# 実装計画: カメラ選択機能

## 目的
ユーザーがブラウザのデフォルトカメラ以外（仮想カメラや複数のWebカメラ）を選択できるようにし、利便性を向上させる。

## 具体的な変更内容

### 1. 状態管理の拡張 (`src/store/useWidgetStore.ts`)
- `selectedCameraId`: 選択されたカメラの `deviceId` を保持（localStorageに永続化）。
- `availableCameras`: 現在利用可能なカメラデバイスのリストを保持。
- 上記を更新するためのアクション `setSelectedCameraId`, `setAvailableCameras` を追加。

### 2. 映像取得ロジックの修正 (`src/components/VideoBackground.tsx`)
- `navigator.mediaDevices.enumerateDevices()` を使用してカメラリストを取得。
- `getUserMedia` の制約（constraints）に `deviceId: { exact: selectedCameraId }` を指定。
- 映像が映っていない状態（起動ボタンが表示されている時）でも、その場でカメラを切り替えられるようにセレクトボックスを配置。

### 3. 設定UIの追加 (`src/components/SettingsMenu/VideoTab.tsx`)
- 映像ソースが「カメラ」の場合のみ、利用可能なカメラのリストをドロップダウン表示するセクションを追加。

### 4. コンポーネント間の連携
- `App.tsx` でストアの値を監視し、`VideoBackground` と `SettingsMenu`（経由して `VideoTab`）に最新の情報を伝搬させる。

## 考慮事項
- **パーミッション**: カメラのラベル（名前）を取得するには一度カメラの使用を許可する必要があるため、初回起動後にリストを再更新する仕組みを導入。
- **UX**: 映像ソースが「なし」や「画面共有」の時は不要な混乱を避けるため選択肢を非表示にする。
