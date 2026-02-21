# 操作説明の移行と設定メニューのタブ記憶の実装

初期画面に自動で表示されていた操作説明を廃止し、設定メニュー内の常設タブ「操作説明」として統合します。また、セッション内でのタブ選択を記憶するように修正します。

## Proposed Changes

### [SettingsMenu](file:///f:/dev/github/tcg-remote-overlay/src/components/SettingsMenu.tsx)
- タブの種類に `guide` を追加。
- `activeTab` と `onTabChange` をプロップス経由で受け取るように変更（状態管理を `App.tsx` へ移動）。
- 左端に「操作説明」タブを追加。
- 従来の `InitialHelpScreen` の内容を `guide` タブのコンテンツとして移植。
- アイコンや色使いを統合。

### [App](file:///f:/dev/github/tcg-remote-overlay/src/App.tsx)
- `activeSettingsTab` 状態を追加。初期値は `'guide'` (アプリ起動時固定)。
- 設定メニューを閉じて開く際、セッション内では直前のタブを保持するように実装。
- `InitialHelpScreen` のレンダリングとインポートを削除。

### [DELETE] [InitialHelpScreen](file:///f:/dev/github/tcg-remote-overlay/src/components/InitialHelpScreen.tsx)
- 不要になったため削除。

## Verification Plan
- アプリ起動時に初期画面が表示されず、設定メニューを開くと「操作説明」タブが選択されていることを確認。
- 設定メニュー内でタブを切り替え、一度閉じて再表示した際に、前回のタブが維持されていることを確認。
- ブラウザをリロードした際は、再度「操作説明」タブから開始されることを確認。
