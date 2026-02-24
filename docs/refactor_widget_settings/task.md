# タスクリスト: ウィジェット設定の共通化とフック分離

## 1. 新しいフックの作成
- [x] `src/hooks/useWidgetSettings.ts` の作成 (Dice, Coin, LP, Card Widget の表示設定管理)
- [x] `src/hooks/useSPMarkerState.ts` の作成 (SPマーカーの状態管理)
- [x] 永続化 (localStorage) とタブ間同期 (BroadcastChannel) の実装

## 2. 既存フックの整理
- [x] `src/hooks/useCardSearch.ts` からウィジェット関連のステートとロジックを削除
- [x] `SharedState` インターフェースの軽量化

## 3. コンポーネント名の変更と汎用化
- [x] `YugiohTools.tsx` を `LPCalculator.tsx` にリネーム
- [x] 内部のインターフェース名 (`YugiohToolsProps` -> `LPCalculatorProps`) の更新
- [x] `WidgetSections.tsx` のセクション名を変更 (`LPCalculatorSection` -> `YugiohSection`, `SPMarkerSection` -> `HololiveSection`)
- [x] UI上のラベルを機能名併記から、将来の拡張性を見据えて元の「遊戯王」「ホロライブ」に復元

## 4. アプリケーション本体の更新
- [x] `src/App.tsx` でのインポート更新
- [x] 新しいフック (`useWidgetSettings`, `useSPMarkerState`) の統合
- [x] 設定メニューへのプロップス受け渡しの修正

## 5. 最終確認
- [x] 各ウィジェットの表示/非表示が正常に動作することを確認
- [x] 別タブ間での表示状態の同期を確認
- [x] リロード後の状態保持を確認
- [x] TypeScriptの型エラーがないことを確認
