# 実装計画：カードウィジェットの挙動調整

## 目的
- カード画像切替の挙動（Shift + 数字キー）の待機時間をご指定の 250ms に調整。
- ライブラリモード（フォルダ検索）からシンプルモード（画像の直接表示）に切り替えた際、不要となるカード検索画面を自動的に閉じるようにする。

## 変更内容

### 1. カード画像切替のデバウンス調整 (`src/App.tsx`)
- `displayCardNoTimerRef.current` にセットしている `setTimeout` の待機時間を 200ms から **250ms** に修正。

### 2. シンプルモード切替時の連動 (`src/App.tsx`, `src/components/CardSearch/CardWidget.tsx`)
- モードが `simple` に変更される箇所（`onCardModeChange`, `onDropFile`, `CardWidget` 内のボタン）で、`BroadcastChannel` ('tcg_remote_app_shortcuts') を通じて `close_search` メッセージを送信するように修正。

### 3. 検索画面の自動終了 (`src/components/CardSearch/CardSearchContainer.tsx`)
- カード検索コンテナ（別タブ・ウィンドウ表示用）の `useEffect` 内で `BroadcastChannel` ('tcg_remote_app_shortcuts') を監視。
- `close_search` メッセージを受信した場合に `window.close()` を実行して自分自身を閉じる。

## 確認事項
- [x] Shift + 数字キーで連続して数字を打った時に、最後の一回だけ画像切り替えが発生すること。
- [x] 設定メニューの切り替えボタン、または画像のドラッグ＆ドロップによりシンプルモードに切り替えた際、開いていた検索画面（タブまたはウィンドウ）が正しく閉じること。
