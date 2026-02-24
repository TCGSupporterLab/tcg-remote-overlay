# 実装計画: ウィジェットグループ化（結合）機能

ウィジェット同士の位置関係を固定し、一括で操作・管理できるようにする「結合（Grouping）」機能を実装します。

## 概要
現在 `Moveable` と `Selecto` によって複数同時操作は可能ですが、一度操作を終えると選択が解除され、グループとしての関係性は失われます。本計画では、この関係性を永続化し、リロード後も一つのユニットとして扱えるようにします。

## ユーザーレビューが必要な項目
- **グループのネスト**: 現時点ではシンプルさを保つため、グループの入れ子（グループのグループ化）はサポートしません。既存のグループを含む選択を結合した場合、古いグループは解体され、新しい一つのグループにフラット化されます。
- **UIの配置**: 複数選択時に画面下部に現れる「アクションバー」を導入します。

## 変更内容

### 1. データ構造とストア (`useWidgetStore.ts`, `widgetTypes.ts`)
グループ情報を保持するための状態を追加します。

#### [MODIFY] [widgetTypes.ts](file:///f:/dev/github/tcg-remote-overlay/src/types/widgetTypes.ts)
```typescript
export interface WidgetGroup {
    id: string; // group_xxxx
    memberIds: WidgetId[];
}

export interface WidgetGroupData {
    groups: WidgetGroup[];
}
```

#### [MODIFY] [useWidgetStore.ts](file:///f:/dev/github/tcg-remote-overlay/src/store/useWidgetStore.ts)
- `groupWidgets()` アクション: 現在の選択範囲から重複を除去し、新規グループを作成。
- `ungroupWidgets()` アクション: 選択中のグループを `groups` 配列から削除。
- `setSelectedWidgets()` の調整: グループメンバーのいずれかが選択された場合、グループ全員を選択状態に含めるように自動展開。

### 2. UI コンポーネント

#### [NEW] [SelectionActionBar.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/SelectionActionBar.tsx)
- 2つ以上のウィジェットが選択された際に表示。
- 「グループ化」ボタン、または選択中にグループが含まれる場合は「解除」ボタンを表示。
- モダンでスタイリッシュなデザイン（グラスモフィズム、アニメーション）を採用。

### 3. Moveable インテグレーション

#### [MODIFY] [MoveableController.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/MoveableController.tsx)
- `selectedWidgetIds` の変更を監視し、グループ展開済みのリストを Moveable の `target` に反映します（既存のロジックを強化）。
- ショートカットキー `G` で `groupWidgets()` を呼び出し。

## 検証計画

### 自動テスト（ビルドチェック）
- `npm run build` で型定義の不整合がないか確認。

### 手動検証
1. **結合機能**: 3Dダイスと3Dコインを矩形選択し、アクションバーの「グループ化」をクリック。
2. **連動移動**: ダイスをドラッグするとコインも一緒に動き、相対位置が維持されることを確認。
3. **回転・拡縮**: グループ枠を操作し、メンバー全員が正しく変形に追従することを確認。
4. **永続化**: ページをリロードし、結合状態が維持されていることを確認。
5. **解除**: 「解除」ボタンを押し、個別に動かせるようになることを確認。
