# 実装計画：ウィジェット設定およびステートの永続化の修正

## 概要
ウィジェット設定、特にライフポイントのプレイヤー表示設定やカード表示モード、SPマーカーの状態がアプリケーション再起動時に意図せずリセットされる問題を修正します。また、不要なステートの整理を行い、コードの健全性を向上させます。

## 修正対象ファイル
- `src/store/useWidgetStore.ts`
- `src/components/LPCalculator.tsx`
- `src/App.tsx`

## 修正内容

### 1. `useWidgetStore.ts` の初期化ロジック改善
`getInitialState` 関数を修正し、`localStorage` からのデータ復旧処理を強化します。

- `parsed.visibility` と `base.visibility` をマージした後、`showSPMarkerForceHidden` を確実に `false` に上書きするように実装を整理します。
- `parsed.settings` と `base.settings` のマージを確実に実施し、`cardMode` などの新設フィールドが古い保存データによって未定義にならないようにします。
- `pinnedCardIds` などの不要なフィールドをインターフェースおよび初期状態から削除します。

### 2. 未使用フィールドの削除
`pinnedCardIds` は現在 `useCardSearch.ts` 側の `pinnedCards` を主として使用しており、ストア側の ID リストは使用されていないため削除します。

### 4. LPターゲットプレイヤーの永続化とリセット
- `useWidgetStore` に `lpTargetPlayer` フィールド（`p1` | `p2`）を追加し、永続化対象に含めます。
- `LPCalculator` のターゲット選択状態をこのフィールドと同期させます。
- `fullReset`（R長押し/リセットボタン）時に `lpTargetPlayer` を `p1` に戻すようにします。

## 期待される結果
- アプリケーションをリロードまたは再起動しても、LPの表示人数設定（Player1のみ表示）が維持される。
- カードの「ライブラリモード」や「シンプルモード」の設定が維持される。
- SPマーカーの一時非表示（Oキー2回押し）の状態は、再起動時に常に「表示」に戻る。
- SPマーカーそのものの有効/無効設定や、表裏の状態は、再起動後も正しく維持される。
- LPのターゲットプレイヤー選択（Player1/2のフォーカス）が再起動後も維持される。
- Rキー長押しや設定メニューのリセットボタンで、LPのターゲットがPlayer 1にリセットされる。
