# オーバーレイ・カードテキスト表示実装計画

オーバーレイ画面において、カード画像の代わりに詳細なテキスト情報を表示する機能を実装します。

## 修正内容

### [Hook] useCardSearch フック
#### [MODIFY] [useCardSearch.ts](file:///f:/dev/github/RemoteDuelTool/src/hooks/useCardSearch.ts)
- `Card` インターフェースを更新し、今回追加した詳細フィールド（`oshiSkills`, `arts`, `keywords`, `abilityText`, `extra`, `limited`）を型定義に含めます。
- `overlayDisplayMode` 状態（`'image' | 'text'`）を追加します。
- `localStorage` への保存および、`BroadcastChannel` を通じた同期ロジックを追加します。
- `toggleOverlayDisplayMode` 関数をエクスポートします。

### [Component] コントローラー UI
#### [NEW] [DisplayModeBadge.tsx](file:///f:/dev/github/RemoteDuelTool/src/components/CardSearch/DisplayModeBadge.tsx)
- 画像モードとテキストモードを切り替えるトグルボタンを作成します。
- **UI仕様**: 現在のモードに対応するアイコン（画像モードなら `Image`, テキストモードなら `Type`）を表示し、一目で現在の状態が分かるようにします。
- 配置場所: `OverlayBadge` の左隣（詳細表示エリア）。

#### [MODIFY] [CardSearchContainer.tsx](file:///f:/dev/github/RemoteDuelTool/src/components/CardSearch/CardSearchContainer.tsx)
- `DisplayModeBadge` をインポートし、詳細表示エリアに配置します。

### [Component] オーバーレイ UI
#### [MODIFY] [HololiveTools.tsx](file:///f:/dev/github/RemoteDuelTool/src/components/HololiveTools.tsx)
- `isOverlay` 部において `overlayDisplayMode` を参照します。
- モードが `'text'` の場合、カード詳細（名前、タイプ、HP、スキル、アーツ、注釈等）を表示する新しいレイアウトを実装します。
- **反転表示の継承**: `overlayMode === 'rotated'` の場合、テキストレイアウト全体を180度回転させて表示します（画像表示時の挙動と一貫性を持たせます）。
- **OBSモードへの最適化**: `obsMode` が `'transparent'` または `'green'` の場合、カード外枠の境界線（`border`）とシャドウ（`box-shadow`）を非表示にし、背景を不透明な暗色に固定することで、クロマキー合成時の視認性と美観を確保します。
- 既存のフレームサイズ（`minWidth: '350px'`, `minHeight: '520px'`）は維持します。

## 検証計画

### 自動テスト
- なし

### 手動確認
1. コントローラーとオーバーレイ窓（`?mode=overlay`）を開く。
2. カードを選択する。
3. コントローラーで「表示モード」を切り替える。
4. オーバーレイ窓が即座に画像とテキストで切り替わることを確認。
5. テキスト表示時、以下の項目が正しく表示されることを確認：
    - 推しホロメン: 推しスキル
    - ホロメン: アーツ、キーワード
    - サポート: 能力テキスト
    - その他: 注釈（Extra）
6. 「回転表示」がテキスト表示時にも適用されることを確認。
