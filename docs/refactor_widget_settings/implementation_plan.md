# 移動・回転・拡大縮小機能の Moveable/Selecto への移行計画

## 1. 目的
現在の自前座標計算ロジックによるバグを解消するため `react-moveable` を導入し、肥大化した `App.tsx` の状態管理を `Zustand` に移行します。
まず Zustand で状態管理の基盤（Store）を整理することで、Moveable 導入時の座標同期ロジックを簡潔に保つことができます。

## 2. 採用するライブラリ
- **Zustand**: 
    - 役割: `App.tsx` の巨大な状態をコンポーネント外部に抽出し、状態遷移を整理。
    - メリット: プロップスバケツリレーの解消、他ウィンドウへの同期（BroadcastChannel）の集約。
- **react-moveable / Selecto**: 
    - 役割: 変形操作（移動・回転・拡大縮小・トリミング）のコアとして使用。
    - メリット: 剛体変換行列の計算をライブラリに委ね、バグ（回転ブレ等）を根絶。

## 3. 段階的実装ステップとその妥当性

### フェーズ0: 状態管理の基盤構築 (Zustand) [完了]
- **理由**: Moveable はターゲットの座標を頻繁に更新するため、先に Store を作っておかないと `App.tsx` 内の `useState` がさらに複雑化します。
- [x] `zustand` のインストール。
- [x] `useWidgetStore` の作成（各ウィジェットの座標 `WidgetState` を管理）。
- [x] `App.tsx` から座標管理ロジックを Store へ委譲。
- [x] `useWidgetSelection` の Store 統合。

### フェーズ1: Moveable 基盤と単一操作
- [ ] `react-moveable`, `selecto` のインストール。
- [ ] `MoveableController`（Store と座標を同期するラッパー）の作成。
- [ ] `OverlayWidget` 内の自前ドラッグハンドル等を廃止。

### フェーズ2: マルチ選択とビデオ背景の統合
- [ ] `Selecto` による矩形選択の実装。
- [ ] ビデオ背景への Moveable 適用（`clippable` によるトリミング移行）。

### フェーズ3: 同期システムの最適化
- [ ] `BroadcastChannel` を Store の `subscribe` から直接叩くように変更し、ウィンドウ間同期の遅延を最小化。
- [ ] ウィジェット間のスナップ、ガイドライン機能の実装。

## 4. 予定されるファイル変更
- `src/store/`: Zustand Store群。
- `src/App.tsx`: 状態ロジックの大幅な削減。
- `src/components/MoveableController.tsx`: [NEW] 操作系の中心コンポーネント。
- `src/components/OverlayWidget.tsx`: 操作用UIの廃止（表示専用化）。
- `src/components/VideoBackground.tsx`: 調整ロジックの移行。
