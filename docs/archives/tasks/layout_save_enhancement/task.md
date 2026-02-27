# タスクリスト: マイレイアウト機能の強化と用語の統一

## 準備と調査
- [ ] 用語「ビデオ」の出現箇所を網羅的に調査する (`grep`)
- [ ] `useWidgetStore.ts` の `MyLayout` 型と `saveLayout`/`applyLayout` アクションの現状を確認する
- [ ] 現状の「レイアウト保存ダイアログ」の実装場所（または実装の必要性）を確認する

## 用語の統一
- [ ] UI上の「ビデオ」を「映像」に置換する
- [ ] 仕様書 (`system_specifications`) 内の「ビデオ」を「映像」に置換する

## ストアと型の調整
- [ ] `src/types/widgetTypes.ts` の `MyLayout` インターフェースに `videoCrop` (任意) と `hideOthers` (boolean) を追加する
- [ ] `src/store/useWidgetStore.ts` の `saveLayout` アクションを拡張し、保存対象の選択 (Widgets/Video/HideOthers) を受け取れるようにする
- [ ] `src/store/useWidgetStore.ts` の `applyLayout` アクションを拡張し、`hideOthers` が true の場合に他のウィジェットを非表示にする
- [ ] `src/store/useWidgetStore.ts` から既存のグローバル設定 `hideNonLayoutWidgets` 関連のコードを削除する
- [ ] `src/data/default_layout/` 内の既存JSONファイルを新構造（`hideOthers: true` 等）に更新する

## UIの実装
- [ ] 共通の「レイアウト保存ダイアログ」コンポーネントを作成（または `App.tsx` 等に組み込む）
- [ ] レイアウト一覧（`LayoutTab.tsx` 等）に、保存内容を示すアイコン（ウィジェット/映像）を表示するロジックを追加
- [ ] アクションバーからの保存フローを修正（ダイアログを表示し、WidgetsをデフォルトONにする）
- [ ] 映像調整メニュー（`VideoBackground.tsx`）に保存ボタンを追加し、映像調整をデフォルトONにする
- [ ] 設定メニュー内の保存ボタンをダイアログ経由に変更し、両方をデフォルトONにする

## 検証
- [ ] アクションバー、映像調整メニュー、設定メニューの3箇所からの保存動作を確認する
- [ ] 用語が「映像」で統一されていることを確認する
- [ ] レイアウトの「インポート/エクスポート」時に映像設定も含まれることを確認する
