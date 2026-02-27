import { Keyboard } from 'lucide-react';

export const ShortcutTab = () => {
    const Kbd = ({ children }: { children: React.ReactNode }) => (
        <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-white font-mono shadow-sm border border-white/20 inline-flex items-center justify-center min-w-[22px]">
            {children}
        </kbd>
    );

    const ShortcutRow = ({ keys, desc }: { keys: string[], desc: string }) => (
        <div className="flex items-center justify-between text-[11px] py-[6px] border-b border-white/5 last:border-0">
            <span className="text-white/60">{desc}</span>
            <div className="flex gap-1 flex-shrink-0 ml-[16px]">
                {keys.map((k, i) => (
                    <Kbd key={i}>{k}</Kbd>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-[28px] pb-[20px] w-full text-left px-[32px] break-words box-border overflow-hidden">
            <div className="space-y-[12px]">
                <h3 className="text-base font-bold text-white flex items-center gap-[8px] border-b border-white/10 pb-[8px]">
                    <Keyboard size={18} className="text-orange-400" />
                    キーボードショートカット
                </h3>
                <p className="text-[11px] text-white/40 pl-[4px]">※ ショートカットは設定メニューが閉じている時のみ有効です（Esc / Ctrl+A / Delete を除く）。</p>

                <div className="space-y-[4px] pl-[4px]">
                    <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">
                        メニュー・操作
                    </div>
                    <ShortcutRow desc="設定メニュー開閉" keys={['Esc']} />
                    <ShortcutRow desc="映像ソース切替（順方向）" keys={['V']} />
                    <ShortcutRow desc="映像ソース切替（逆方向）" keys={['Shift+V']} />
                    <ShortcutRow desc="映像調整モード切替" keys={['A']} />
                    <ShortcutRow desc="映像調整モード切替（マウス）" keys={['ホイールクリック']} />

                    <div className="text-[10px] text-gray-500 font-bold mt-[16px] mb-1 uppercase tracking-wider">
                        ツール
                    </div>
                    <ShortcutRow desc="ダイスを振る" keys={['D']} />
                    <ShortcutRow desc="コイントス" keys={['C']} />
                    <ShortcutRow desc="SPマーカー反転 / 表示切替（2回連打）" keys={['O']} />
                    <ShortcutRow desc="ダイス / コイン（2回連打）" keys={['.']} />
                    <ShortcutRow desc="全状態リセット（長押し）" keys={['R']} />

                    <div className="text-[10px] text-gray-500 font-bold mt-[16px] mb-1 uppercase tracking-wider">
                        選択・表示
                    </div>
                    <ShortcutRow desc="カード画像切替（複数桁対応）" keys={['Shift+数字']} />
                    <ShortcutRow desc="レイアウト呼び出し（複数桁対応）" keys={['Alt+数字']} />
                    <ShortcutRow desc="全ウィジェット選択" keys={['Ctrl+A']} />
                    <ShortcutRow desc="選択中のウィジェットを非表示" keys={['Del']} />

                    <div className="text-[10px] text-gray-500 font-bold mt-[16px] mb-1 uppercase tracking-wider">
                        ライフポイント計算機（遊戯王）
                    </div>
                    <ShortcutRow desc="数値入力" keys={['0-9']} />
                    <ShortcutRow desc="加算" keys={['+']} />
                    <ShortcutRow desc="減算" keys={['-', 'Enter']} />
                    <ShortcutRow desc="半分" keys={['/']} />
                    <ShortcutRow desc="入力クリア" keys={['Del']} />
                    <ShortcutRow desc="対象プレイヤー切替" keys={['P', '*']} />
                    <ShortcutRow desc="元に戻す" keys={['Ctrl+Z']} />
                    <ShortcutRow desc="やり直し" keys={['Ctrl+Y']} />
                </div>
            </div>
        </div>
    );
};
