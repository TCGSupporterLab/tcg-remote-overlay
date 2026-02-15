# Remote Duel Overlay (リモートデュエル・オーバーレイ)

[English](./README_en.md) <!-- 将来的に英語READMEを作る場合のリンク -->

OBSなどの配信ソフトで使用することを想定した、トレーディングカードゲーム（TCG）のリモート対戦用オーバーレイツールです。
特に「遊戯王OCG」および「ホロライブOCG」に対応（予定）しています。

## 🌟 主な機能

### 🃏 遊戯王モード
- **ライフポイント計算機**: 
  - プレイヤーごとのライフ管理
  - ログ機能（履歴表示）
  - Undo / Redo（取り消し・やり直し）機能
- **3D ダイス機能**: 物理演算風の3Dサイコロアニメーション
- **コイントス機能**: 3Dコイントスアニメーション
- **計算機UI**: キーボード操作に最適化された入力インターフェース

### 📹 オーバーレイ機能
- **背景透過**: OBSのブラウザソースとして追加することで、カメラ映像の上にオーバーレイ表示可能
- **クロマキー不要**: 背景は最初から透過設定済み
- **レスポンシブ**: ウィンドウサイズに合わせてレイアウトが調整されます

## 🚀 使い方

### インストールと起動

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/icns-sj/RemoteDuelTool.git
   cd RemoteDuelTool
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   ```

3. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

4. **OBSへの追加**
   - OBSの「ソース」→「ブラウザ」を追加
   - URLに `http://localhost:5173` (または表示されたURL) を入力
   - 幅・高さを設定（例: 1920x1080）
   - 「カスタムCSS」は空にするか必要に応じて調整

## ⌨️ キーボードショートカット

| キー | 動作 |
| --- | --- |
| `0-9` (テンキー) | 数字入力 |
| `+` | 加算 (+) |
| `-` (または Enter) | 減算 (-) |
| `/` | ライフを半分にする (ハーフ) |
| `Delete` / `Backspace` | 入力クリア |
| `Ctrl + Z` | Undo (取り消し) |
| `Ctrl + Y` | Redo (やり直し) |
| `↑` / `←` | Player 1 (自分) を選択 |
| `↓` / `→` | Player 2 (相手) を選択 |

## 🛠 技術スタック

- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: CSS Modules / Tailwind CSS (一部)
- **State Management**: React Hooks (Context/Reducer pattern)
- **Icons**: Lucide React

## 📝 ライセンス

MIT License
