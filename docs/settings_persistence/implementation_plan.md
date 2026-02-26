# 実装計画：設定メニューの自動非表示機能

## 1. データ構造の変更
`useWidgetStore.ts` の `settings` オブジェクトに `hideSettingsOnStart: boolean` を追加します。
- デフォルト値: `false`
- 永続化対象: `tcg_remote_settings_v4` (既存の settings 保存ロジックに統合)

## 2. UI の実装
`SettingsMenu.tsx` のヘッダー部、閉じるボタン (`X` アイコン) の左側にトグルスイッチ（チェックボックス）を配置します。
- スタイル: 他のメニュー項目と合わせたモダンなデザイン（rounded-xl, hover effect）。
- ラベル: 「アクセス時に非表示」

## 3. アプリケーション起動ロジックの調整
`App.tsx` の `showSettings` ステートの初期値を固定の `true` から、ストアの `hideSettingsOnStart` に基づく動的な値に変更します。
- 初期化コード: `useState(() => !settings.hideSettingsOnStart)`

## 4. 既存機能との整合性
- Escキーや右クリックによるメニュー開閉機能には影響を与えないようにします。
- メニューが非表示で開始された場合でも、ユーザーは通常通りメニューを呼び出せることを確認します。
