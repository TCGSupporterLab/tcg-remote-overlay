# 状態管理のリファクタリング (Zustand への移行) 完了

アプリケーションの状態管理を `App.tsx` の `useState` から Zustand ストア (`useWidgetStore`) へ統合しました。これにより、コードの可読性が向上し、将来的な機能拡張（`react-moveable` の統合など）に向けた準備が整いました。

## 主な変更内容

### 1. 中央集中型ストアの導入
- [useWidgetStore.ts](file:///f:/dev/github/tcg-remote-overlay/src/store/useWidgetStore.ts) を作成し、以下の状態を統合しました：
  - ウィジェットの座標・回転・スケール (`widgetStates`)
  - 可視性設定 (`visibility`)
  - アプリケーション設定 (`settings`)
  - 選択状態 (`selectedWidgetIds`, `isSelecting`, `selectionRect`)
  - グループデータ (`groupData`)
  - ビデオ設定および OBS モード

### 2. コンポーネントのクリーンアップ
- [App.tsx](file:///f:/dev/github/tcg-remote-overlay/src/App.tsx) から大量の `useState` と複雑な状態同期ロジックを削除しました。
- `useWidgetSelection` フックを Zustand Store 連携版に更新し、矩形選択の状態もストアで一元管理されるようにしました。

### 3. クロスウィンドウ同期と永続化
- `BroadcastChannel API` を使用して、メインウィンドウと検索ウィンドウ間での状態同期を維持しました。
- `localStorage` を使用して、リロード後も設定や座標が保持されるようにしました。

### 4. TypeScript 型の修正
- `selectedWidgetIds` を `Set` から `Array` に変更し、それに伴うロジック（`.size` -> `.length` など）をすべて修正しました。
- `verbatimModuleSyntax` に対応するため、型インポートの書き方を修正しました。

## 確認事項

- [x] ウィジェットのドラッグ、回転、スケールが正常に動作し、ストアに反映されること。
- [x] 矩形選択（ドラッグによる複数選択）が機能し、選択枠が表示されること。
- [x] グループ化と解除が正しく動作すること。
- [x] 設定（OBS モードや動画ソース）がリロード後も維持されること。
- [x] 検索ウィンドウでの変更がメインウィンドウに即座に同期されること。

## 今後のステップ
このリファクタリングにより、状態管理が整理されたため、次は `react-moveable` を使用した高度なウィジェット操作の実装に進むことが可能です。
