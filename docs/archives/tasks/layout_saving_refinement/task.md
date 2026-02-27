# タスクリスト: マイレイアウト機能の強化と用語の統一

## 準備と調査
- [x] 用語「ビデオ」の出現箇所を網羅的に調査する (`grep`)
- [x] `useWidgetStore.ts` の `MyLayout` 型と `saveLayout`/`applyLayout` アクションの現状を確認する
- [x] 現状の「レイアウト保存ダイアログ」の実装場所（または実装の必要性）を確認する

## 用語の統一
- [x] UI上の「ビデオ」を「映像」に置換する
- [x] 仕様書 (`system_specifications`) 内の「ビデオ」を「映像」に置換する

## ストアと型の調整
- [x] `src/types/widgetTypes.ts` の `MyLayout` インインターフェースに `videoCrop` (任意) と `hideOthers` (boolean) を追加する
- [x] `src/store/useWidgetStore.ts` の `saveLayout` アクションを拡張し、保存対象の選択 (Widgets/Video/HideOthers) を受け取れるようにする
- [x] `src/store/useWidgetStore.ts` の `applyLayout` アクションを拡張し、`hideOthers` が true の場合に他のウィジェットを非表示にする
- [x] `src/store/useWidgetStore.ts` から既存のグローバル設定 `hideNonLayoutWidgets` 関連のコードを削除する

## UIの実装
- [x] 共通の「レイアウト保存ダイアログ」コンポーネントを作成（または `App.tsx` 等に組み込む）
- [x] レイアウト一覧（`LayoutTab.tsx` 等）に, 保存内容を示すアイコン（ウィジェット/映像）を表示するロジックを追加
- [x] アクションバーからの保存フローを修正（ダイアログを表示し、WidgetsをデフォルトONにする）
- [x] 映像調整メニュー（`VideoBackground.tsx`）に保存ボタンを追加し、映像調整をデフォルトONにする
- [x] 設定メニュー内の保存ボタンをダイアログ経由に変更し、両方をデフォルトONにする

## 検証
- [x] アクションバー、映像調整メニュー、設定メニューの3箇所からの保存動作を確認する
- [x] 用語が「映像」で統一されていることを確認する
- [x] レイアウトの「インポート/エクスポート」時に映像設定も含まれることを確認する
