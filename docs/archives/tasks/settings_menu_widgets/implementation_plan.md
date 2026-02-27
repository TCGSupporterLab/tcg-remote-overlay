# 実装計画: 設定メニューのウィジェット設定

## 目的
ユーザーがオーバーレイ上の各種ウィジェット（ダイス、コイン、ライフポイント、カード情報）の表示・非表示を個別に切り替えられるようにし、その設定をウィンドウ間で同期・永続化する。また、ライフポイントの初期値などの詳細設定も可能にする。

## 変更内容

### 1. 状態管理の拡張 (`src/hooks/useCardSearch.ts`)
- `SharedState` インターフェースに以下の項目を追加：
  - `isDiceVisible`, `isCoinVisible`, `isLPVisible`, `isCardWidgetVisible`: 各ウィジェットの表示フラグ
  - `initialLP`: ライフポイントの初期値
  - `showLPHistory`: LP履歴の表示フラグ
- `updateShared` 関数を更新し、これらの設定が変更された際に IndexedDB への保存と `BroadcastChannel` 経由の同期を行うようにする。
- フックの戻り値に、これらの設定を更新するための setter 関数を追加。

### 2. 設定メニューの更新 (`src/components/SettingsMenu.tsx`)
- ダミーのローカルステートを削除し、`App.tsx` から渡されるプロップスを使用するように変更。
- トグルスイッチの `onChange` イベントで共有ステートの setter を呼び出すように接続。
- ライフポイントセクションに、初期LP入力フィールドと履歴表示トグルを追加。

### 3. ゲームツールの更新 (`src/components/YugiohTools.tsx`, `src/components/HololiveTools.tsx`)
- プロップスとして受け取った表示フラグに基づき、`OverlayDisplay` やプレイヤー情報のレンダリングを条件付きで行う。
- 遊戯王モードでは、`initialLP` 設定を初期ライフポイントおよびリセット時の基準として使用する。
- ライフポイント履歴の表示・非表示を `showLPHistory` フラグで制御する。

### 4. 共通ウィジェット表示の更新 (`src/components/OverlayDisplay.tsx`)
- `showDice` プロップスを追加し、ダイスの表示・非表示を切り替えられるようにする（コインは既に `showCoin` が存在）。

### 5. メインアプリケーションの統合 (`src/App.tsx`)
- `useCardSearch` から抽出した新しい設定情報と setter を `SettingsMenu` および各ツールコンポーネントに伝播させる。

## 期待される効果
- 検索ウィンドウで変更したウィジェット設定が、即座にメインのオーバーレイウィンドウに反映される。
- アプリケーションを再起動しても、最後に設定した表示状態が維持される。
- 特定のウィジェット（例：不要なコインなど）を非表示にして、画面をシンプルに保つことができる。
