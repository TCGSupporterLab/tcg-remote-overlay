# ガジェット結合機能 実装計画

## 概要

画面上に表示される独立したウィジェットをグループ化し、位置関係を維持したまま一括で移動・回転・拡縮できるようにする。

本機能はウィジェットの種別に依存しない汎用的な仕組みとして設計し、今後ウィジェットが追加された場合にも自動的に対象となるようにする。

### 背景
- 過去に一度実装を試み、`SettingsMenu.tsx` の巨大化とJSX構文エラーが原因で失敗
- 現在は `SettingsMenu` がタブ・コンポーネント分割済みのため、この問題は解消されている

### 現行のウィジェット一覧

| WidgetId | コンポーネント | 備考 |
|---|---|---|
| `card_widget` | `CardWidget` | カード画像表示 |
| `yugioh` | `YugiohTools` | ライフポイント |
| `hololive_sp_marker` | `SPMarkerWidget` | SPマーカー |
| `dice` | `OverlayDisplay` | 3Dダイス |
| `coin` | `OverlayDisplay` | 3Dコイン |

### 将来ビジョン
- 現行の「ゲームモード」（遊戯王/ホロライブ切替）は、テンプレートのインポート/エクスポート機能に置き換え予定
- テンプレート = グループ構成＋ウィジェットの表示/非表示＋位置設定を一括保存/復元
- 「おすすめ設定」としてプリセットテンプレートを提供し、ゲームモードの代わりに使えるようにする

---

## フェーズ構成

### フェーズ1：複数選択・グループ化・グループ移動（今回の実装範囲）
- 複数選択機能（**Ctrl+クリック** / **矩形ドラッグ選択**）
- 複数選択時のフローティングアクションUI（マウスでグループ化）
- `WidgetGroup` データ構造の追加
- グループ化/解除ロジック
- グループ移動・回転・拡縮の連動
- メンバー非表示時のグループ整合性維持
- `localStorage` 永続化

### フェーズ2：テンプレート管理（次回以降）
- グループ構成のインポート/エクスポート
- プリセットテンプレート（現行ゲームモードの置き換え）
- SettingsMenu でのテンプレート選択UI

---

## 提案する変更内容

### データ構造

---

#### [NEW] [widgetTypes.ts](file:///f:/dev/github/tcg-remote-overlay/src/types/widgetTypes.ts)

```typescript
// ウィジェットの識別子。OverlayWidget の gameMode と同値。
// 新ウィジェット追加時は新しい文字列を割り当てるだけで自動的にグループ化対象になる。
type WidgetId = string;

interface WidgetGroup {
  id: string;            // グループのUUID
  memberIds: WidgetId[];
  anchorId: WidgetId;    // 基準ウィジェット
}

interface RelativeTransform {
  dx: number;
  dy: number;
  dRotation: number;
  dScale: number;
}

interface WidgetGroupData {
  groups: WidgetGroup[];
  relativeTransforms: Record<WidgetId, RelativeTransform>;
}
```

**汎用性の担保**: グループ化ロジックは `WidgetId` のみで動作し、ウィジェットの実装詳細（コンポーネント、props等）に一切依存しない。新しいウィジェットを `OverlayWidget` でラップして配置するだけで、追加のコード変更なしにグループ化の対象となる。

---

### 複数選択＋フローティングアクションUI

---

#### [NEW] [useWidgetSelection.ts](file:///f:/dev/github/tcg-remote-overlay/src/hooks/useWidgetSelection.ts)

ウィジェットの複数選択状態を管理するカスタムフック。

**管理する状態:**
- `selectedWidgetIds: Set<WidgetId>` — 選択中のウィジェットID集合
- `isSelecting: boolean` — 矩形選択ドラッグ中か
- `selectionRect: { x, y, w, h } | null` — 矩形選択の領域

**操作フロー:**

| 操作 | 動作 |
|---|---|
| ウィジェットをクリック | 単一選択（既存選択はクリア） |
| Ctrl + ウィジェットをクリック | トグル選択（追加/解除） |
| 背景でドラッグ | 矩形選択 → 矩形内のウィジェットを全選択 |
| 背景クリック / Escape | 選択解除 |

---

#### [NEW] [SelectionActionBar.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/SelectionActionBar.tsx)

2つ以上選択されたときに画面下部にポップアップするフローティングバー。

**表示内容:**
- 選択中のウィジェット数（例: 「3 個選択中」）
- 「結合」ボタン（`G` キーと同等）
- 「選択解除」ボタン

---

#### [MODIFY] [OverlayWidget.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/OverlayWidget.tsx)

1. **新しいプロパティ**: `instanceId`, `isSelected`, `isGrouped`, `isGroupAnchor`, `onSelect(id, ctrlKey)`, `onStateChange(id, newState)`
2. **選択状態の視覚フィードバック**: ハイライト枠
3. **グループ連動**: アンカー操作時に `onStateChange` で差分通知
4. **非アンカーの操作制限**: ハンドル非表示

**汎用性**: プロパティは全て `OverlayWidget` レベルで完結。ラップされる子コンポーネントには一切変更不要。

---

#### [MODIFY] [App.tsx](file:///f:/dev/github/tcg-remote-overlay/src/App.tsx)

1. **`useWidgetSelection`** フック導入
2. **`WidgetGroupData`** の状態管理 + `localStorage` 永続化
3. **グループ化/解除関数**
4. **グループ移動ハンドラ**: アンカーの `onStateChange` → メンバー差分反映
5. **矩形選択UIの描画**
6. **`SelectionActionBar`** 配置
7. **`G` キーでグループ化 / `Escape` で選択解除**
8. **アンカー自動昇格ロジック**
9. **各 `OverlayWidget` に汎用プロパティを渡す**

---

## メンバー非表示時のグループ挙動

### 基本方針
**グループは非表示操作では自動解除しない。** 相対座標データを保持し続け、再表示時に正しい位置に復帰する。

| ケース | 挙動 |
|---|---|
| **非アンカーが非表示** | グループ維持。`RelativeTransform` 保持。裏で座標更新。再表示で正位置に出現 |
| **アンカーが非表示** | アンカー自動昇格: `memberIds` 順で最初の表示中ウィジェットに操作ハンドルが移動。元アンカー再表示で復帰 |
| **全メンバーが非表示** | データ保持、操作不能。再表示で復帰 |

### アンカー自動昇格

```
function resolveActiveAnchor(group, visibilityMap): WidgetId | null {
  if (visibilityMap[group.anchorId]) return group.anchorId;
  return group.memberIds.find(id => visibilityMap[id]) ?? null;
}
```

> [!IMPORTANT]
> `anchorId` は永続値。一時昇格は表示ロジックのみで `anchorId` は書き換えない。

---

## 座標計算

### グループ化時
```
1. 選択ウィジェットのうち最初のものを anchorId とする
2. 各メンバーの相対座標:
   dx = member.px - anchor.px
   dy = member.py - anchor.py
   dRotation = member.rotation - anchor.rotation
   dScale = member.scale / anchor.scale
```

### グループ移動時
```
各メンバーの絶対座標（非表示含む）:
   member.px = activeAnchor.px + dx
   member.py = activeAnchor.py + dy
   member.rotation = activeAnchor.rotation + dRotation
   member.scale = activeAnchor.scale * dScale
```

---

## 検証計画

### ビルド検証（自動）
```bash
npx tsc --noEmit
npm run lint
npm run build
```

### 手動検証（ユーザー）

1. **複数選択**: Ctrl+クリック / 矩形選択 / 解除
2. **フローティングUI**: 2つ以上選択 → 「結合」ボタンでグループ化
3. **グループ移動**: アンカードラッグでメンバー追従
4. **非表示時挙動**: アンカー昇格・再表示復帰
5. **永続化**: リロード後にグループ維持
6. **解除**: 独立移動に復帰

> [!NOTE]
> ユニットテストフレームワーク未導入のため、ビルドチェック＋手動テストで検証。
