# Remote Duel Overlay - 実装計画書

## プロジェクト概要
OBS配信での使用を想定した、トレーディングカードゲーム（TCG）リモート対戦支援ツール。
**完全クライアントサイド（サーバーレス）** で動作し、GitHub Pages等で容易に配布可能にする。

### ターゲットゲーム
1.  **遊戯王OCG**
2.  **ホロライブ・オフィシャル・カードゲーム**



## 技術スタック
-   **Core**: React (TypeScript), Vite
-   **Styling**: Vanilla CSS (CSS Modules) - *ユーザールール準拠*
-   **OCR**: Tesseract.js (ブラウザ内処理)
-   **Deploy**: GitHub Pages

## アーキテクチャ・設計

### 1. UI/UXデザイン
-   **レスポンシブ**: PC (OBSオーバーレイ/操作用) と スマホ (操作用コントローラー) の両方で見やすいデザイン。
-   **OBSモード**: 背景色を「クロマキーグリーン(#00FF00)」または「透明(RGBA)」に切り替え可能にする。
-   **テーマ**: ゲーミング感のあるダークモード基調。

### 2. 機能要件

#### A. 共通機能
-   **サイコロ**: 1〜6のランダム表示（CSS 3Dアニメーション推奨）
-   **コイン**: 表/裏のランダム表示
-   **リセット**: 全状態の初期化

#### B. 遊戯王モード
-   **ライフ計算**: 8000スタート。`+`, `-`, 半減, 入力ログ表示。
-   **表示**: お互いのライフ（自分は操作、相手は手動入力またはカメラ認識結果のメモ用として入力）。

#### C. ホロライブOCGモード
-   **ツール機能**: ダイス・コイン機能を提供（将来的な拡張用プレースホルダー）。


## 開発フェーズ

### Phase 1: セットアップ & UI実装
-   Viteプロジェクト作成
-   ベースレイアウト（モード切替タブ、サイドバー）作成

### Phase 2: ツールロジック実装
-   サイコロ・コインのコンポーネント作成
-   各TCGのライフ管理ロジック実装

### Phase 3: (キャンセル) 盤面認識機能
-   *技術的課題およびユーザー判断により実装見送り*


### Phase 4: 配布準備
-   ビルド設定調整
-   ドキュメント整備

### Phase 5: カード検索機能 (Hololive Only)
-   **検索ロジック**:
    -   **キーワード**: カード名（かな検索・約物無視）。空欄時はフィルタのみで検索。
    -   **結合条件**: 各フィルタカテゴリ間は **AND**、カテゴリ内複数選択は **OR**。
-   **詳細フィルター (Hololive)**:
    -   **色**: 白, 緑, 赤, 青, 紫, 黄, 無, 多色, 多色を含めない (デフォルト: すべて)
    -   **タイプ**: ホロメン, Buzzホロメン, 推しホロメン, サポート,LIMITED (デフォルト: すべて)
    -   **レアリティ**: RR, R, U, C, OSR, OC, SEC, OUR, HR, UR, SR, P, S (デフォルト: すべて)
    -   **Bloom**: Debut, 1st, 2nd, Spot (デフォルト: すべて)
    -   **キーワード効果** : コラボエフェクト, ブルームエフェクト, ギフト
    -   **UI挙動**: 「すべて」選択で他を解除。個別選択で「すべて」を解除。
-   **表示**: 検索ヒットしたカード画像のグリッド表示
-   **ピン留め**: 最大10件まで。専用リセットボタン。
-   **データ取得フロー (Hololive)**:
    1.  **自動取得 (Script)**: `scripts/fetch-hololive-data.js` (Puppeteer使用) を実行する。
        -   **動作**: ブラウザを起動 -> ページアクセス -> 無限スクロールで全件読み込み -> DOM解析 -> JSON保存。
        -   **Filter**: 「エール」カードは除外する。
        -   **Validation**: 取得件数が想定(約1725件)とかけ離れていないかチェック。
    2.  **利用**: アプリは生成された `src/data/hololive-cards.json` を読み込む。




## 検証計画
### Phase 6: さらに快適に - 常時表示モード
#### [MODIFY] [App.tsx](file:///f:/dev/github/RemoteDuelTool/src/App.tsx)
-   **State Refactoring**: `toolResult` (object) -> `diceValue` (number), `coinValue` (string), `diceKey` (number), `coinKey` (number)
    -   `diceKey` / `coinKey`: increment on roll/flip to trigger animation even if result is same.
-   **Remove**: `autoClose`, `visible` logic, `handleReset` clearing logic.
-   **Initialize**: Default Dice=1, Coin=表.

#### [MODIFY] [OverlayDisplay.tsx](file:///f:/dev/github/RemoteDuelTool/src/components/OverlayDisplay.tsx)
-   **Props**: Accept `diceValue`, `coinValue`, `diceKey`, `coinKey`.
-   **Layout**: Always render both `ThreeDDice` and `ThreeDCoin` side-by-side.
-   **Animation**: Trigger `isRolling`/`isFlipping` when `key` changes.
-   **Remove**: Modal wrapper, Close button.

### Phase 7: UI/UX 最終調整
#### [MODIFY] [App.tsx](file:///f:/dev/github/RemoteDuelTool/src/App.tsx)
-   **Handlers**: Pass `handleRollDice` / `handleFlipCoin` to `OverlayDisplay`.
-   **Footer**: Remove "Dice" and "Coin" buttons.

#### [MODIFY] [OverlayDisplay.tsx](file:///f:/dev/github/RemoteDuelTool/src/components/OverlayDisplay.tsx)
-   **Props**: Accept `onDiceClick`, `onCoinClick`.
-   **Layout**: Increase `gap` between dice and coin (e.g. `gap-32`).
-   **Interaction**: Add `onClick` handlers with `cursor-pointer`.

#### [MODIFY] [animations.css](file:///f:/dev/github/RemoteDuelTool/src/animations.css)
-   **Sizing**: Reduce `.coin` size (140px -> 110px) to match `.cube` visually.
-   **Border**: Adjust coin border thickness if needed.

#### [MODIFY] [App.tsx](file:///f:/dev/github/RemoteDuelTool/src/App.tsx)
-   **Keyboard Support**: Add `useEffect` listener for `keydown` events.
    -   'd' / 'D': Roll Dice
    -   'c' / 'C': Flip Coin
    -   Ensure not to trigger if input is focused (just in case).

#### [MODIFY] [YugiohLife.tsx](file:///f:/dev/github/RemoteDuelTool/src/components/YugiohLife.tsx)
    - [x] Use `w-[45%]` or similar to limit width of player panels so they don't overlap center.
    - [x] Remove fixed large gap which might break on smaller screens.

### Phase 8: ビジュアル強化 - ライフ表示
#### [MODIFY] [YugiohLife.tsx](file:///f:/dev/github/RemoteDuelTool/src/components/YugiohLife.tsx)
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

### Phase 9: 計算機UIの改善 (New!)
#### [MODIFY] [YugiohLife.tsx](file:///f:/dev/github/RemoteDuelTool/src/components/YugiohLife.tsx)
- **新規ステート**: `targetPlayer` の初期値を `'p1'` に設定。
- **UIインタラクション**:
    - P1/P2カードをクリックして `targetPlayer` を設定。
    - 選択されたプレイヤーに視覚的なフォーカス（枠線/リング）を付与。
- **計算機UI**:
    - コントローラーモードでは常時表示。
    - **ボタン構成**:
        - `7` `8` `9` `CLR`
        - `4` `5` `6` `+`
        - `1` `2` `3` `-`
        - `0` `00` `000` `÷2`
        - `Undo` `Redo` (最下段に追加)
    - **ロジック**:
        -   `+`: ターゲットのライフに入力値を加算。
        -   `-`: ターゲットのライフから入力値を減算。
        -   `÷2`: ターゲットのライフを半分にする（切り上げ）。
        -   `CLR`: 入力をクリア。
        -   `Undo`: ターゲットに関係なくライフ状態を1つ前の状態に戻す。（最初まで戻れるようにする）
        -   `Redo`: ターゲットに関係なくライフ状態を1つ進める。（最新まですすめるようにする）
- **削除**: キャンセル/決定/ダメージ/回復/半減ボタン。
