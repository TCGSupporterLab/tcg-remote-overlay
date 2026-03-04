import { Keyboard } from 'lucide-react';

export const ShortcutTab = () => {
    const Kbd = ({ children }: { children: React.ReactNode }) => (
        <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-white font-mono shadow-sm border border-white/20 inline-flex items-center justify-center min-w-[22px]">
            {children}
        </kbd>
    );

    const ShortcutRow = ({ keys, desc, hasAsterisk, isSub }: { keys: string[], desc: string, hasAsterisk?: boolean, isSub?: boolean }) => (
        <div className={`flex items-center justify-between text-[11px] py-[6px] border-b border-white/5 last:border-0 ${isSub ? 'pl-[16px]' : ''}`}>
            <span className="text-white/60">
                {desc}
                {hasAsterisk && <sup className="text-cyan-400 ml-0.5">※</sup>}
            </span>
            <div className="flex gap-1 flex-shrink-0 ml-[16px]">
                {keys.map((k, i) => (
                    <Kbd key={i}>{k}</Kbd>
                ))}
            </div>
        </div>
    );

    const SubHeader = ({ title }: { title: string }) => (
        <div className="text-[10px] text-gray-500 font-bold mt-[16px] mb-1 uppercase tracking-wider">
            {title}
        </div>
    );

    return (
        <div className="space-y-[28px] pb-[20px] w-full text-left px-[32px] break-words box-border overflow-hidden">
            <div className="space-y-[12px]">
                <h3 className="text-base font-bold text-white flex items-center gap-[8px] border-b border-white/10 pb-[8px]">
                    <Keyboard size={18} className="text-orange-400" />
                    ショートカット
                </h3>
                <p className="text-[11px] text-white/40 pl-[4px]">ショートカットは設定メニューが閉じている時のみ有効です（Esc を除く）。</p>
                <p className="text-[11px] text-cyan-400/80 pl-[4px] font-medium">※印のあるキーはカード画像選択画面がフォーカスされている時も利用可能です。</p>

                <div className="space-y-[4px] pl-[4px]">
                    <div className="text-[10px] text-white/40 font-black mb-1 uppercase tracking-[0.1em] border-l-2 border-primary/50 pl-[8px]">
                        メニュー・表示設定
                    </div>
                    <ShortcutRow desc="設定メニュー開閉" keys={['Esc']} />
                    <ShortcutRow desc="映像ソース切替（順方向）" keys={['V']} />
                    <ShortcutRow desc="映像ソース切替（逆方向）" keys={['Shift+V']} />
                    <ShortcutRow desc="映像調整モード切替" keys={['A', 'ホイールクリック']} />
                    <ShortcutRow desc="レイアウト呼び出し（複数桁対応）" keys={['Alt+数字']} />
                    <ShortcutRow desc="全ウィジェット選択" keys={['Ctrl+A']} />
                    <ShortcutRow desc="選択中のウィジェットを非表示" keys={['Delete']} />

                    <div className="text-[10px] text-white/40 font-black mt-[20px] mb-1 uppercase tracking-[0.1em] border-l-2 border-secondary/50 pl-[8px]">
                        ウィジェット操作
                    </div>
                    <ShortcutRow desc="全状態リセット（長押し）" keys={['R']} hasAsterisk />
                    <ShortcutRow desc="ダイスを振る" keys={['D']} hasAsterisk />
                    <ShortcutRow desc="コイントス" keys={['C']} hasAsterisk />
                    <ShortcutRow desc="ダイス / コイン（2回連打）" keys={['.']} hasAsterisk />
                    <ShortcutRow desc="SPマーカー反転 / 表示切替（2回連打）" keys={['O']} hasAsterisk />

                    <SubHeader title="カード" />
                    <ShortcutRow desc="画像選択画面を 別窓で開く / 別タブで開く （2回連打）" keys={['L']} isSub />
                    <ShortcutRow desc="カード画像切替（複数桁対応）" keys={['Shift+数字']} hasAsterisk isSub />
                    <ShortcutRow desc="ファイル／フォルダの接続解除" keys={['左ダブルクリック']} isSub />

                    <SubHeader title="ライフポイント計算機" />
                    <ShortcutRow desc="数値入力" keys={['0-9']} hasAsterisk isSub />
                    <ShortcutRow desc="加算" keys={['+']} hasAsterisk isSub />
                    <ShortcutRow desc="減算" keys={['-', 'Enter']} hasAsterisk isSub />
                    <ShortcutRow desc="半分" keys={['/']} hasAsterisk isSub />
                    <ShortcutRow desc="入力クリア" keys={['Delete']} hasAsterisk isSub />
                    <ShortcutRow desc="対象プレイヤー切替" keys={['P', '*']} hasAsterisk isSub />
                    <ShortcutRow desc="元に戻す" keys={['Ctrl+Z']} hasAsterisk isSub />
                    <ShortcutRow desc="やり直し" keys={['Ctrl+Y']} hasAsterisk isSub />
                </div>
            </div>
        </div>
    );
};
