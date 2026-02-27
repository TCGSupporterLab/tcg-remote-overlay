# マイレイアウト機能の実装タスク

## 1. 準備とデータ定義 [x]
- [x] `src/types/widgetTypes.ts` に `MyLayout` インターフェースを定義 <!-- id: 1 -->
- [x] `src/store/useWidgetStore.ts` に状態とアクションを追加 <!-- id: 2 -->
    - [x] `myLayouts`, `hasImportedDefaultLayouts`, `hideNonLayoutWidgets` の追加
    - [x] `saveLayout`, `applyLayout`, `deleteLayout`, `importLayout`, `setHideNonLayoutWidgets` の実装

## 2. 既存機能の名称変更と調整 [x]
- [x] 「表示プリセット」を「マイレイアウト」に統合・改名 <!-- id: 3 -->
    - [x] `src/components/SettingsMenu/GeneralTab.tsx` の修正
    - [x] `src/store/useWidgetStore.ts` から `activePreset` への依存を排除（必要に応じて）

## 3. アクションバーへの統合 [x]
- [x] `SelectionActionBar.tsx` に「マイレイアウトに追加」ボタンを追加 <!-- id: 4 -->
- [x] 保存時の名前入力モーダルの実装 <!-- id: 5 -->

## 4. 設定メニューの実装 [x]
- [x] 設定メニューに「マイレイアウト」タブを追加 <!-- id: 6 -->
- [x] レイアウト一覧の表示（名前、復元、エクスポート、削除） <!-- id: 7 -->
- [x] 「復元時に他を非表示」トグルの実装 <!-- id: 13 -->
- [x] インポート時のバリデーションロジック実装 <!-- id: 14 -->
- [x] インポート機能（ファイル選択）の実装 <!-- id: 8 -->

## 5. 初期化・同期ロジック [x]
- [x] キャッシュがない場合のプロジェクト内デフォルトレイアウト読み込み <!-- id: 9 -->
- [x] 復元時のウィジェット表示強制ON、グループ解除ロジックの実装 <!-- id: 10 -->

## 6. 検証 [x]
- [x] 手動テストによる動作確認 <!-- id: 11 -->
- [x] ウォークスルーの作成 <!-- id: 12 -->
