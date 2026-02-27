# 実装計画: カード検索画面のステート同期と無限ループの修正

## 1. 現状の分析
- **無限ループの原因**: 
  - `useCardSearch.ts` の `Relinking Effect` が、他のタブから届いた `selectedCard` や `pinnedCards` の `imageUrl` (Blob URL) が自身のタブの URL と異なることを検知し、`updateShared` で修正を行う。
  - `updateShared` はデフォルトで `BroadcastChannel` へ放送するため、他のタブがそれを受信し、また同様の「修正」を行って送り返すという連鎖が発生している。
- **挙動不審の原因**: 
  - 新規タブ起動時の `useEffect` によるフィルターリセットが全体に放送され、操作中の他タブの状態を壊している。
  - `App.tsx` の同期ロジックが、`useLocalCards` の初期化中（データ準備中）に走り、一時的に不整合な状態でステートを更新している。

## 2. 修正内容

### A. `useCardSearch.ts` の `updateShared` 拡張
- 第3引数 `skipBroadcast?: boolean` を追加。
- `skipBroadcast` が `true` の場合は `channel.postMessage` をスキップするように変更。

### B. `useCardSearch.ts` の `useEffect` 修正
- **再同期 Effect (Relinking)**: `updateShared` 呼び出し時に `skipBroadcast: true` を指定。自分自身のローカルステートのみを最新の Blob URL に修正し、他タブへは送り返さない。
- **初期化 Effect**: `skipBroadcast: true` を指定するか、または冗長な初期化を整理する。

### C. `App.tsx` の同期ロジック修正
- `isLoading` が `true` の間は `rootFolderName` の同期処理をスキップするガードを追加。

## 3. 検証ステップ
1. メイン画面と検索画面を同時に開く。
2. 検索画面でカードをクリックする。
   - 1回の選択で安定し、変な点滅や選択解除が発生しないことを確認。
3. 検索画面でフォルダを移動し、パンくずリストで戻る。
   - スムーズに階層が移動できることを確認。
4. 一方の画面で検索ワードを入力し、もう一方に（反映されてもされなくても）異常が発生しないことを確認。
5. リロードしてもフォルダ接続状態が正しく維持されることを確認。
