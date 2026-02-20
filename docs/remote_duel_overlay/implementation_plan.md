# Remote Duel Overlay - 実裁E��画書

## プロジェクト概要E
OBS配信での使用を想定した、トレーチE��ングカードゲーム�E�ECG�E�リモート対戦支援チE�Eル、E
**完�Eクライアントサイド（サーバ�Eレス�E�E* で動作し、GitHub Pages等で容易に配币E��能にする、E

### ターゲチE��ゲーム
1.  **遊戯王OCG**
2.  **ホロライブ�Eオフィシャル・カードゲーム**



## 技術スタチE��
-   **Core**: React (TypeScript), Vite
-   **Styling**: Vanilla CSS (CSS Modules) - *ユーザールール準拠*
-   **OCR**: Tesseract.js (ブラウザ冁E�E琁E
-   **Deploy**: GitHub Pages

## アーキチE��チャ・設訁E

### 1. UI/UXチE��イン
-   **レスポンシチE*: PC (OBSオーバ�Eレイ/操作用) と スマ�E (操作用コントローラー) の両方で見やすいチE��イン、E
-   **OBSモーチE*: 背景色を「クロマキーグリーン(#00FF00)」また�E「透�E(RGBA)」に刁E��替え可能にする、E
-   **チE�EチE*: ゲーミング感�Eあるダークモード基調、E

### 2. 機�E要件

#### A. 共通機�E
-   **サイコロ**: 1、Eのランダム表示�E�ESS 3Dアニメーション推奨�E�E
-   **コイン**: 表/裏�Eランダム表示
-   **リセチE��**: 全状態�E初期匁E

#### B. 遊戯王モーチE
-   **ライフ計箁E*: 8000スタート。`+`, `-`, 半渁E 入力ログ表示、E
-   **表示**: お互いのライフ（�E刁E�E操作、相手�E手動入力また�Eカメラ認識結果のメモ用として入力）、E

#### C. ホロライブOCGモーチE
-   **チE�Eル機�E**: ダイス・コイン機�Eを提供（封E��皁E��拡張用プレースホルダー�E�、E


## 開発フェーズ

### Phase 1: セチE��アチE�E & UI実裁E
-   Viteプロジェクト作�E
-   ベ�Eスレイアウト（モード�E替タブ、サイドバー�E�作�E

### Phase 2: チE�EルロジチE��実裁E
-   サイコロ・コインのコンポ�Eネント作�E
-   各TCGのライフ管琁E��ジチE��実裁E

### Phase 3: (キャンセル) 盤面認識機�E
-   *技術的課題およ�Eユーザー判断により実裁E��送り*


### Phase 4: 配币E��備
-   ビルド設定調整
-   ドキュメント整傁E

### Phase 5: カード検索機�E (Hololive Only)
-   **検索ロジチE��**:
    -   **キーワーチE*: カード名�E�かな検索・紁E��無視）。空欁E��はフィルタのみで検索、E
    -   **結合条件**: 吁E��ィルタカチE��リ間�E **AND**、カチE��リ冁E��E��選択�E **OR**、E
-   **詳細フィルター (Hololive)**:
    -   **色**: 白, 緁E 赤, 靁E 紫, 黁E 無, 多色, 多色を含めなぁE(チE��ォルチE すべて)
    -   **タイチE*: ホロメン, Buzzホロメン, 推し�Eロメン, サポ�EチELIMITED (チE��ォルチE すべて)
    -   **レアリチE��**: RR, R, U, C, OSR, OC, SEC, OUR, HR, UR, SR, P, S (チE��ォルチE すべて)
    -   **Bloom**: Debut, 1st, 2nd, Spot (チE��ォルチE すべて)
    -   **キーワード効极E* : コラボエフェクチE ブルームエフェクチE ギフト
    -   **UI挙動**: 「すべて」選択で他を解除。個別選択で「すべて」を解除、E
-   **表示**: 検索ヒットしたカード画像�EグリチE��表示
-   **ピン留め**: 最大10件まで。専用リセチE��ボタン、E
-   **チE�Eタ取得フロー (Hololive)**:
    1.  **自動取征E(Script)**: `scripts/fetch-hololive-data.js` (Puppeteer使用) を実行する、E
        -   **動佁E*: ブラウザを起勁E-> ペ�Eジアクセス -> 無限スクロールで全件読み込み -> DOM解极E-> JSON保存、E
        -   **Filter**: 「エール」カード�E除外する、E
        -   **Validation**: 取得件数が想宁E紁E725件)とかけ離れてぁE��ぁE��チェチE��、E
    2.  **利用**: アプリは生�EされぁE`src/data/hololive-cards.json` を読み込む、E




## 検証計画
### Phase 6: さらに快適に - 常時表示モーチE
#### [MODIFY] [App.tsx](file:///f:/dev/github/tcg-remote-overlay/src/App.tsx)
-   **State Refactoring**: `toolResult` (object) -> `diceValue` (number), `coinValue` (string), `diceKey` (number), `coinKey` (number)
    -   `diceKey` / `coinKey`: increment on roll/flip to trigger animation even if result is same.
-   **Remove**: `autoClose`, `visible` logic, `handleReset` clearing logic.
-   **Initialize**: Default Dice=1, Coin=表.

#### [MODIFY] [OverlayDisplay.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/OverlayDisplay.tsx)
-   **Props**: Accept `diceValue`, `coinValue`, `diceKey`, `coinKey`.
-   **Layout**: Always render both `ThreeDDice` and `ThreeDCoin` side-by-side.
-   **Animation**: Trigger `isRolling`/`isFlipping` when `key` changes.
-   **Remove**: Modal wrapper, Close button.

### Phase 7: UI/UX 最終調整
#### [MODIFY] [App.tsx](file:///f:/dev/github/tcg-remote-overlay/src/App.tsx)
-   **Handlers**: Pass `handleRollDice` / `handleFlipCoin` to `OverlayDisplay`.
-   **Footer**: Remove "Dice" and "Coin" buttons.

#### [MODIFY] [OverlayDisplay.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/OverlayDisplay.tsx)
-   **Props**: Accept `onDiceClick`, `onCoinClick`.
-   **Layout**: Increase `gap` between dice and coin (e.g. `gap-32`).
-   **Interaction**: Add `onClick` handlers with `cursor-pointer`.

#### [MODIFY] [animations.css](file:///f:/dev/github/tcg-remote-overlay/src/animations.css)
-   **Sizing**: Reduce `.coin` size (140px -> 110px) to match `.cube` visually.
-   **Border**: Adjust coin border thickness if needed.

#### [MODIFY] [App.tsx](file:///f:/dev/github/tcg-remote-overlay/src/App.tsx)
-   **Keyboard Support**: Add `useEffect` listener for `keydown` events.
    -   'd' / 'D': Roll Dice
    -   'c' / 'C': Flip Coin
    -   Ensure not to trigger if input is focused (just in case).

#### [MODIFY] [YugiohLife.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/YugiohLife.tsx)
    - [x] Use `w-[45%]` or similar to limit width of player panels so they don't overlap center.
    - [x] Remove fixed large gap which might break on smaller screens.

### Phase 8: ビジュアル強匁E- ライフ表示
#### [MODIFY] [YugiohLife.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/YugiohLife.tsx)
-   **Text Styling**:
    -   Apply `bg-gradient-to-br` (e.g., from-white to-gray-400) with `bg-clip-text text-transparent`.
    -   Add `drop-shadow` for glow effect (e.g., cyan/magenta glow for players).
-   **HP Bar**:
    -   Add a progress bar component below the number.
    -   Width = `(currentLife / 8000) * 100` (clamped).
    -   Color changes based on health (Green > Yellow > Red).
-   **Container**:
    -   Add glassmorphism background (`bg-black/40 backdrop-blur-sm`).
    -   Add subtle borders (`border-white/10`).
    -   Apply `transform: rotate(180deg)` to the entire player card in overlay mode if `isRotated` is true.

### Phase 9: 計算機UIの改喁E(New!)
#### [MODIFY] [YugiohLife.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/YugiohLife.tsx)
- **新規スチE�EチE*: `targetPlayer` の初期値めE`'p1'` に設定、E
- **UIインタラクション**:
    - P1/P2カードをクリチE��して `targetPlayer` を設定、E
    - 選択されたプレイヤーに視覚的なフォーカス�E�枠緁Eリング�E�を付与、E
- **計算機UI**:
    - コントローラーモードでは常時表示、E
    - **ボタン構�E**:
        - `7` `8` `9` `CLR`
        - `4` `5` `6` `+`
        - `1` `2` `3` `-`
        - `0` `00` `000` `÷2`
        - `Undo` `Redo` (最下段に追加)
    - **ロジチE��**:
        -   `+`: ターゲチE��のライフに入力値を加算、E
        -   `-`: ターゲチE��のライフから�E力値を減算、E
        -   `÷2`: ターゲチE��のライフを半�Eにする�E��Eり上げ�E�、E
        -   `CLR`: 入力をクリア、E
        -   `Undo`: ターゲチE��に関係なくライフ状態を1つ前�E状態に戻す。（最初まで戻れるようにする�E�E
        -   `Redo`: ターゲチE��に関係なくライフ状態を1つ進める。（最新まですすめるようにする�E�E
- **削除**: キャンセル/決宁Eダメージ/回復/半減�Eタン、E


