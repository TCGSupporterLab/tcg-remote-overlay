# Moveable/Selecto & Zustand 移行タスク

- [x] 依存ライブラリのインストール (`zustand`)
- [x] フェーズ0: 状態管理の基盤構築 (Zustand)
    - [x] `useWidgetStore.ts` の作成（座標・表示管理）
    - [x] `App.tsx` から主要 State を順次 Store へ移行
    - [x] `useWidgetSelection` の Store 統合
- [ ] フェーズ1: Moveable 基盤と単一操作
    - [ ] `MoveableController.tsx` の作成
    - [ ] `OverlayWidget.tsx` の自前ハンドル廃止と表示専用化
- [ ] フェーズ2: マルチ選択とビデオ背景の統合
    - [ ] `Selecto` による矩形選択の実装
    - [ ] ビデオ背景への `Moveable` 適用とトリミング実装
- [ ] フェーズ3: 同期最適化と高度な調整
    - [ ] ウィンドウ間同期ロジックの Store 集約と最適化
    - [ ] スナップ・ガイドライン機能の実装
