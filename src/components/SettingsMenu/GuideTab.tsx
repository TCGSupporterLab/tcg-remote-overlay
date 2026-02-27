import { Info, Settings, Layers, Camera } from 'lucide-react';

export const GuideTab = () => (
    <div className="space-y-[8px]">
        <div className="text-center mb-[8px]">
            <h1 className="text-xl font-black mb-[0px] tracking-tight text-white">
                TCG Remote Overlay の使い方
            </h1>
            <hr className="border-white/20 my-[20px]" />
        </div>

        <div className="space-y-[0px] pl-[48px] pt-[4px]">
            <div className="bg-white/5 rounded-lg p-[0px] border border-white/5 hover:bg-white/10 transition-colors group">
                <h3 className="text-sm font-bold flex items-center gap-[6px] text-white mb-[0px]">
                    <Settings size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    設定メニューを開く/閉じる
                </h3>
                <p className="text-xs text-white/70 ml-[22px]">
                    <kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-mono shadow-sm border border-white/20">Esc</kbd> か <strong>右クリック</strong> で、設定を開閉できます。
                </p>
            </div>

            <div className="bg-white/5 rounded-lg p-[0px] border border-white/5 hover:bg-white/10 transition-colors group">
                <h3 className="text-sm font-bold flex items-center gap-[6px] text-white mb-[0px]">
                    <Layers size={16} className="text-green-400 group-hover:scale-110 transition-transform" />
                    レイアウトの選択
                </h3>
                <p className="text-xs text-white/70 ml-[22px]">
                    「マイレイアウト」から保存した配置を呼び出せます。
                </p>
            </div>

            <div className="bg-white/5 rounded-lg p-[0px] border border-white/5 hover:bg-white/10 transition-colors group">
                <h3 className="text-sm font-bold flex items-center gap-[6px] text-white mb-[0px]">
                    <Camera size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
                    映像の入力と調整
                </h3>
                <p className="text-xs text-white/70 ml-[22px]">
                    「映像入力」で調整モードを有効にすると、ドラッグで位置やサイズを変更できます。
                </p>
            </div>

            <div className="bg-white/5 rounded-lg p-[0px] border border-white/5 hover:bg-white/10 transition-colors group">
                <h3 className="text-sm font-bold flex items-center gap-[6px] text-white mb-[0px]">
                    <span className="p-1 bg-white/10 rounded-md text-orange-400 group-hover:scale-110 transition-transform">⌨</span>
                    便利なショートカット
                </h3>
                <div className="text-xs text-white/70 ml-[22px] space-y-1">
                    <p><kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-mono shadow-sm border border-white/20">Shift + V</kbd> : カメラ/画面共有/なし を<b>逆順</b>で切り替え</p>
                    <p><kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-mono shadow-sm border border-white/20">R</kbd> を 1.5秒間長押し : 全ての状態をリセット</p>
                    <p><kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-mono shadow-sm border border-white/20">O</kbd> : SPマーカーの表裏反転（素早く2Tapで一時表示切替）</p>
                </div>
            </div>

            <div className="bg-white/5 rounded-lg p-[0px] border border-white/5 hover:bg-white/10 transition-colors group">
                <h3 className="text-sm font-bold flex items-center gap-[6px] text-white mb-[0px]">
                    <Info size={16} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                    OBS配信ソフト
                </h3>
                <p className="text-xs text-white/70 ml-[22px]">
                    「GB」を選択し、OBS側でクロマキー設定を行うと背景を透過させられます。
                </p>
            </div>
        </div>
    </div>
);
