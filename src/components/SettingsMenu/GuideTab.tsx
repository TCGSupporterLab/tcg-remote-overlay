import { MousePointer2, Scan, Box, Camera, Monitor, Dice6, CircleDot, Save } from 'lucide-react';

export const GuideTab = () => {
    const Kbd = ({ children }: { children: React.ReactNode }) => (
        <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-white font-mono shadow-sm border border-white/20 inline-flex items-center justify-center min-w-[22px]">
            {children}
        </kbd>
    );

    const Step = ({ num, title, children }: { num: number, title: string, children: React.ReactNode }) => (
        <div className="flex gap-[12px]">
            <div className="w-[28px] h-[28px] rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                {num}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
                <div className="text-xs text-white/60 leading-relaxed space-y-1.5">
                    {children}
                </div>
            </div>
        </div>
    );



    return (
        <div className="space-y-[28px] pb-[20px] w-full text-left px-[32px] break-words box-border overflow-hidden">

            {/* はじめに */}
            <div className="pt-[8px] space-y-[8px]">
                <h2 className="text-lg font-black tracking-tight text-white">
                    はじめに
                </h2>
                <p className="text-xs text-white/50 leading-relaxed">
                    TCG Remote Overlay は、リモート対戦時に必要なダイス・コイン・ライフポイント計算・カード画像表示などを、
                    ブラウザ1つで完結させるオーバーレイツールです。<br />
                    Discord等で画面共有するだけで、相手にもオーバーレイが見える状態で対戦を始められます。
                </p>
                <p className="text-xs text-white/50 leading-relaxed">
                    <Kbd>Esc</Kbd> または<span className="font-bold text-white">背景を右クリック</span>で、いつでも設定メニューを開閉できます。
                </p>
                <p className="text-xs text-white/40 leading-relaxed">
                    推奨ブラウザ：<span className="font-bold text-white/60">Google Chrome</span> または <span className="font-bold text-white/60">Microsoft Edge</span>（デスクトップ版）
                </p>
            </div>

            {/* セットアップガイド */}
            <div className="space-y-[16px]">
                <h3 className="text-base font-bold text-white flex items-center gap-[8px] border-b border-white/10 pb-[8px]">
                    <MousePointer2 size={18} className="text-blue-400" />
                    セットアップ手順
                </h3>

                <div className="space-y-[16px] pl-[4px]">
                    <Step num={1} title="映像ソースを選ぶ">
                        <p>
                            <span className="font-bold text-white">「背景・映像」</span>タブで映像ソースを選択します。
                        </p>
                        <div className="flex gap-[12px] mt-1">
                            <span className="flex items-center gap-1 text-white/80"><Camera size={12} /> カメラ</span>
                            <span className="flex items-center gap-1 text-white/80"><Monitor size={12} /> 画面共有</span>
                        </div>
                        <p className="text-white/40">
                            カメラで手元を映す、または画面共有で対戦画面を映す使い方が一般的です。
                        </p>
                        <p className="text-white/40">
                            ショートカット：<Kbd>V</Kbd> で順方向切替 / <Kbd>Shift+V</Kbd> で逆方向切替
                        </p>
                    </Step>

                    <Step num={2} title="映像の位置・サイズを調整する">
                        <p>
                            「背景・映像」タブの<span className="font-bold text-white">「調整モード」</span>を有効にすると、
                            映像をドラッグで移動・リサイズできます。
                        </p>
                        <p className="text-white/40">
                            ショートカット：<Kbd>A</Kbd> で調整モードの切替 / <Kbd>ホイールクリック</Kbd> でも切替可能
                        </p>
                    </Step>

                    <Step num={3} title="ウィジェットを有効にする">
                        <p>
                            <span className="font-bold text-white">「ウィジェット」</span>タブで必要なツールを有効にします。
                        </p>
                        <div className="space-y-1 mt-1 pl-[4px] text-white/50">
                            <p className="flex items-center gap-2"><Dice6 size={12} className="text-amber-400" /> ダイス — 対戦の先攻後攻決めなどに（<Kbd>D</Kbd>）</p>
                            <p className="flex items-center gap-2"><CircleDot size={12} className="text-sky-400" /> コイン — コイントスの裏表判定に（<Kbd>C</Kbd>）</p>
                            <p className="flex items-center gap-2"><Scan size={12} className="text-purple-400" /> カード表示 — 自分のカード画像を相手に見せる</p>
                        </div>
                    </Step>

                    <Step num={4} title="カード画像を使う（任意）">
                        <p>
                            カードウィジェットの設定で<span className="font-bold text-white">フォルダを指定</span>すると、
                            フォルダ内の画像をまとめてスキャンし、<Kbd>Shift+数字</Kbd> で素早く切り替えて表示できます。
                        </p>
                        <p>
                            フォルダではなく<span className="font-bold text-white">画像を1枚だけ選んで表示</span>することも可能です。
                        </p>
                        <p className="text-white/40">
                            相手から「そのカードなに？」と聞かれた時に、画像をすぐに表示できます。
                        </p>
                    </Step>

                    <Step num={5} title="画面を共有して対戦開始">
                        <p>
                            Discord などで<span className="font-bold text-white">このブラウザタブを画面共有</span>すれば準備完了です。
                            設定メニューを閉じた状態の画面がそのまま相手に見えます。
                        </p>
                    </Step>
                </div>
            </div>

            {/* ウィジェットの使い方 */}
            <div className="space-y-[16px]">
                <h3 className="text-base font-bold text-white flex items-center gap-[8px] border-b border-white/10 pb-[8px]">
                    <Box size={18} className="text-green-400" />
                    ウィジェットの操作
                </h3>
                <div className="text-xs text-white/60 leading-relaxed space-y-[12px] pl-[4px]">
                    <div>
                        <h4 className="font-bold text-white mb-1">移動・リサイズ</h4>
                        <p>各ウィジェットはドラッグで自由に動かせます。ウィジェットの位置は自動で保存されます。</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-1">カード画像の切替</h4>
                        <p>
                            <Kbd>Shift</Kbd> + <Kbd>数字</Kbd> でスキャン済みカードの表示を番号で切り替えられます。<br />
                            複数桁にも対応しています（例：<Kbd>1</Kbd> → <Kbd>2</Kbd> と素早く入力で12番目のカード）。
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-1">遊戯王：ライフポイント計算</h4>
                        <p>専用ウィジェットで2プレイヤー分のLP管理ができます。キーボードのみで操作します（詳細は「ショートカット」タブを参照）。</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-1">ホロライブOCG：SPマーカー</h4>
                        <p>SPマーカーの表裏をキー操作で切り替えられます（<Kbd>O</Kbd>キー）。</p>
                    </div>
                </div>
            </div>

            {/* レイアウト管理 */}
            <div className="space-y-[16px]">
                <h3 className="text-base font-bold text-white flex items-center gap-[8px] border-b border-white/10 pb-[8px]">
                    <Save size={18} className="text-emerald-400" />
                    レイアウトの保存・呼び出し
                </h3>
                <div className="text-xs text-white/60 leading-relaxed space-y-[12px] pl-[4px]">
                    <p>
                        <span className="font-bold text-white">「マイレイアウト」</span>タブでは、現在のウィジェット配置・映像の調整結果を保存し、
                        いつでも呼び出すことができます。
                    </p>
                    <p>
                        保存済みレイアウトに表示された番号に対応する数字を <Kbd>Alt</Kbd> + <Kbd>数字</Kbd> で入力すると、
                        設定メニューを開かずに瞬時にレイアウトを切り替えられます。
                    </p>
                    <p className="text-white/40">
                        例：遊戯王用レイアウトとホロライブOCG用レイアウトを保存しておき、ゲームに応じて切り替える使い方ができます。
                    </p>
                </div>
            </div>
        </div>
    );
};
