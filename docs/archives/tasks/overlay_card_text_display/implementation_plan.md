# オーバ�Eレイ・カードテキスト表示実裁E��画

オーバ�Eレイ画面において、カード画像�E代わりに詳細なチE��スト情報を表示する機�Eを実裁E��ます、E

## 修正冁E��

### [Hook] useCardSearch フック
#### [MODIFY] [useCardSearch.ts](file:///f:/dev/github/tcg-remote-overlay/src/hooks/useCardSearch.ts)
- `Card` インターフェースを更新し、今回追加した詳細フィールド！EoshiSkills`, `arts`, `keywords`, `abilityText`, `extra`, `limited`�E�を型定義に含めます、E
- `overlayDisplayMode` 状態！E'image' | 'text'`�E�を追加します、E
- `localStorage` への保存およ�E、`BroadcastChannel` を通じた同期ロジチE��を追加します、E
- `toggleOverlayDisplayMode` 関数をエクスポ�Eトします、E

### [Component] コントローラー UI
#### [NEW] [DisplayModeBadge.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/CardSearch/DisplayModeBadge.tsx)
- 画像モードとチE��ストモードを刁E��替えるトグルボタンを作�Eします、E
- **UI仕槁E*: 現在のモードに対応するアイコン�E�画像モードなめE`Image`, チE��ストモードなめE`Type`�E�を表示し、一目で現在の状態が刁E��るよぁE��します、E
- 配置場所: `OverlayBadge` の左隣�E�詳細表示エリア�E�、E

#### [MODIFY] [CardSearchContainer.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/CardSearch/CardSearchContainer.tsx)
- `DisplayModeBadge` をインポ�Eトし、詳細表示エリアに配置します、E

### [Component] オーバ�Eレイ UI
#### [MODIFY] [HololiveTools.tsx](file:///f:/dev/github/tcg-remote-overlay/src/components/HololiveTools.tsx)
- `isOverlay` 部において `overlayDisplayMode` を参照します、E
- モードが `'text'` の場合、カード詳細�E�名前、タイプ、HP、スキル、アーチE��注釈等）を表示する新しいレイアウトを実裁E��ます、E
- **反転表示の継承**: `overlayMode === 'rotated'` の場合、テキストレイアウト�E体を180度回転させて表示します（画像表示時�E挙動と一貫性を持たせます）、E
- **OBSモードへの最適匁E*: `obsMode` ぁE`'transparent'` また�E `'green'` の場合、カード外枠の墁E��線！Eborder`�E�とシャドウ�E�Ebox-shadow`�E�を非表示にし、背景を不透�Eな暗色に固定することで、クロマキー合�E時�E視認性と美観を確保します、E
- 既存�Eフレームサイズ�E�EminWidth: '350px'`, `minHeight: '520px'`�E��E維持します、E

## 検証計画

### 自動テスチE
- なぁE

### 手動確誁E
1. コントローラーとオーバ�Eレイ窓！E?mode=overlay`�E�を開く、E
2. カードを選択する、E
3. コントローラーで「表示モード」を刁E��替える、E
4. オーバ�Eレイ窓が即座に画像とチE��ストで刁E��替わることを確認、E
5. チE��スト表示時、以下�E頁E��が正しく表示されることを確認！E
    - 推し�Eロメン: 推しスキル
    - ホロメン: アーチE��キーワーチE
    - サポ�EチE 能力テキスチE
    - そ�E仁E 注釈！Extra�E�E
6. 「回転表示」がチE��スト表示時にも適用されることを確認、E


