# 実装計画: カードウィジェットの状態維持とD&Dの洗練

## 1. 現状の分析
- **App.tsx**: `rootFolderName` の同期時に `wasEmpty` フラグを使用しており、フォルダ間の切り替え時にはキャッシュの復元 (`restoreFolderCache`) が実行されない不具合がある。
- **useCardSearch.ts**: ピン留め情報を最新のカードデータ (`normalizedData`) と照合して URL を更新するロジックがあるが、依存配列が `normalizedData` のみである。そのため、フォルダ切り替えなどで `sharedState.pinnedCards` が後から更新された場合にリフレッシュが走らず、古い（無効な）Blob URL が残ってしまう。

## 2. 修正内容

### A. App.tsx の修正 (フォルダ同期ロジック)
- `prevFolderRef` および `wasEmpty` の判定を削除、または簡略化する。
- `currentName` (現在のフォルダ名) が `rootFolderName` (共有ステート上の名) と異なる場合、かつ `currentName` が空でない場合は常に `restoreFolderCache(currentName)` を実行する。
- これにより、D&D で新しいフォルダを落とした際や、セッション再開時に確実に過去のピン留め情報がロードされる。

### B. useCardSearch.ts の修正 (リフレッシュロジック)
- 永続化データの再同期 (`useEffect`) の依存配列に `state.pinnedCards` (または `sharedState.pinnedCards`) を追加する。
- これにより、`restoreFolderCache` によって古い URL を含むピン留めリストが読み込まれた直後に、現在のセッションで有効な `normalizedData` との照合・置換が走り、画像が正常に表示されるようになる。

### C. CardWidget.tsx の微調整 (任意)
- 必要に応じて、D&D 操作時のステート遷移（`dragOverType`）の挙動を確認し、よりスムーズな体験を提供する。

## 3. 検証ステップ
1. ライブラリモードで適当なフォルダ A を開き、数枚ピン留めする。
2. 画像を D&D してシンプルモードに切り替える（画像が表示されることを確認）。
3. 設定メニューからライブラリモードに戻す。
   - ピン留めカードが消えずに表示されることを確認。
4. 別のフォルダ B を D&D する。
   - フォルダ B が読み込まれ、B 用のピン留め（過去にあれば）が表示されることを確認。
5. フォルダ A を再度 D&D する。
   - フォルダ A のピン留めが正常に復元されることを確認。
