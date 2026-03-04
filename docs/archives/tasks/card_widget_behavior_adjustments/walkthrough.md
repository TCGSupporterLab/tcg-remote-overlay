# 修正内容の確認：カードウィジェットの挙動調整

## 主な変更内容

今回の修正では、カード切替の待機時間の微調整、およびライブラリモードからシンプルモードへの切替時の利便性向上を行いました。

### 1. カード画像切替の待機時間調整
- [App.tsx](file:///f:/dev/github/tcg-remote-overlay/src/App.tsx) 内の `Shift + 数字キー` 入力の待機時間を **250ms** に設定。
- これにより、2桁、3桁の入力を素早く行った際に、途中の画像が表示されるのを防ぐデバウンス処理の精度を調整しました。

### 2. ライブラリモードからシンプルモードへの切替時の連動
- ライブラリモードからシンプルモードに切り替えた際、現在開いているカード検索・選択画面を自動的に閉じるようにしました。
- 以下の3箇所すべてで連動が機能します：
  - 設定メニュー内のモード切替ボタン
  - 画像のドラッグ＆ドロップによるモード切替
  - カードウィジェット内の「画像を選択」ボタン

### 3. 検索画面の自動終了ロジック
- [CardSearchContainer.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/CardSearch/CardSearchContainer.tsx) に `BroadcastChannel` を介した終了命令のリスナーを追加。
- 別タブや別ウィンドウで開いているカード検索画面が、モード切替の通知 (close_search) を受け取った瞬間に `window.close()` を実行します。

## 詳細な変更点

| ファイル | 変更箇所 | 備考 |
| :--- | :--- | :--- |
| `src/App.tsx` | カード切替のデバウンス待機時間 | 200ms -> 250ms に変更 |
| `src/App.tsx` | `onCardModeChange`, `onDropFile` | モード切替時に 'close_search' 通知を送信 |
| `src/components/CardSearch/CardWidget.tsx` | 「画像を選択」ボタンのクリック時 | モード切替時に 'close_search' 通知を送信 |
| `src/components/CardSearch/CardSearchContainer.tsx` | `useEffect` | 'close_search' 通知を受信したらウィンドウを閉じるように修正 |

今回の変更により、シンプルモードに移行した際に、不要となった検索ウィンドウが邪魔になることがなくなり、操作性が向上しました。
