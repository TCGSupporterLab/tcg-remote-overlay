# 実装計画: ZIPモーダルの改善と展開ロジックの堅牢化

## 1. UIの調整 (App.tsx / SettingsMenu.tsx)
- [x] ZIP確認モーダルのデザイン微調整
- [x] 不要な情報の削減（主なフォルダ表示の削除）
- [x] 成功時の自動クローズ処理

## 2. 展開ロジックの強化 (useLocalCards.ts)
- [x] **自動サブフォルダ作成:** `targetHandle.getDirectoryHandle(zipName, { create: true })` を使用。
- [x] **パスの正規化:** Windows環境特有のバックスラッシュ (`\`) をスラッシュ (`/`) に変換。
- [x] **サニタイズ:** ファイル名やフォルダ名に含まれる禁止文字 (`< > : " / \ | ? *`) をアンダースコアに置換。
- [x] **多重実行ガード:** 展開中に別の処理が走らないよう `useRef` フラグを追加。

## 3. 無限ループの防止 (useLocalCards.ts / useCardSearch.ts)
- [x] **スキャンガード:** `scanInProgressRef` によるスキャンの重複実行防止。
- [x] **URL同期ガード:** `useCardSearch.ts` の `useEffect` 内で、共有状態の更新ループを `useRef` と `skipBroadcast` で抑制。
- [x] **Blob URLの管理:** スキャン開始前に既存のURLを確実に `revokeObjectURL` する。

## 4. 検証項目
- [x] ZIP展開後、自動的に新しいカードが表示されること
- [x] Windows環境で `NotFoundError` が発生しないこと
- [x] タブを開いたまま接続を切り替えても無限ループしないこと
