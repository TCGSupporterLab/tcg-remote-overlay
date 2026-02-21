# メタデータ・検索エンジンの修正実装計画

ユーザーからのご指摘（次世代設計書 `next_generation_architecture_design.md` との不一致）を受け、以下の通り実装を修正します。

## Proposed Changes

### [useCardSearch](file:///f:/dev/github/tcg-remote-overlay/src/hooks/useCardSearch.ts)
- **[DELETE] ホロライブ同梱データ（JSON）の削除**:
  - `hololive-cards.json` のインポートおよび `normalizedData` への結合処理をコード上から削除します。
  - **※注意**: ユーザーのローカルPC上にあるテスト用のカード画像ファイル群はそのまま保持し、一切削除・変更しません。
  - 設計書の「特定のTCGのカード画像をアプリ内に同梱せず、全てローカルから読み込む」方針に従い、UIのベースデータを `localCards` （読み込まれたローカルファイル）のみに一本化します。

### [useLocalCards](file:///f:/dev/github/tcg-remote-overlay/src/hooks/useLocalCards.ts)
- **[MODIFY] 同名ファイルの同一判定ロジックの修正**:
  - 同名ファイルが複数存在する場合の挙動を修正します。
  - **デフォルト挙動**: パスで区別し、同名ファイルでも**別々のカード**として取り込みます（これまでの強制統合処理を廃止）。
  - **結合オプション挙動**: `mergeSameNameCards` フラグが有効な場合のみ、同名ファイルを一つにまとめます。その際の優先順位は「1. ルートフォルダ内のファイル」「2. サブフォルダのうちフォルダ名昇順で一番上のもの」に従うように並び替え処理（ソートロジック）を修正します。

### [SettingsMenu](file:///f:/dev/github/tcg-remote-overlay/src/components/SettingsMenu.tsx) & [CardSearchContainer](file:///f:/dev/github/tcg-remote-overlay/src/components/CardSearch/CardSearchContainer.tsx)
- **[NEW] ウィジェット画面へのカードリスト統合**:
  - 設定メニューの「ウィジェット」タブ内に、新しく「カード表示ウィジェット」自体の表示をON/OFFするトグルスイッチを設けます。
  - **上記トグルのON/OFFに関わらず**、その詳細設定として「ローカルカード画像の読み込み」に関するUI（フォルダアクセス、同名ファイル結合設定）を操作可能にします。
  - 画像が読み込まれている（`cardCount > 0`）場合には、設定メニュー内にカード選択UI (`CardSearchContainer`) を展開表示（またはモーダル表示）するボタン等の導線を設け、そこから直接カードの切り替え・ピン留めができるようにします。
  - これに伴い、`App.tsx` から `SettingsMenu` に `localCards` を渡すよう変更します。

---

## Verification Plan

### Manual Verification
1. **同梱データ削除の確認**:
   - ローカルフォルダを読み込まずに起動した際、元々表示されていた公式のホロライブカードが表示されない（空のキャンバス状態である）ことを確認する。
2. **デフォルトの同名ファイル挙動**:
   - `deckA/token.png` と `deckB/token.png` が存在する場合、設定がオフであれば2つの `token.png` が個別にリストに並ぶことを確認する。
3. **同名ファイル統合設定の挙動**:
   - 設定をオンにして再読み込みを行うと、`token.png` が1つになり、想定された優先順位（ルート > `deckA` > `deckB`）の画像が使用されていることを確認する。
4. **設定メニュー経由の検索UI機能確認** (New):
   - 設定メニューのタブ項目に新しく追加された「カードリスト」にアクセスできることを確認する。
   - そこでカードを選び（ピン留めなど）、設定を閉じた際にオーバーレイのカード表示ウィジェット側に正しく反映されることを確認する。
