import { Dices, Coins, RectangleVertical, RefreshCw, Info, Heart, Sparkles, ChevronRight } from 'lucide-react';
import { SettingsToggle, SettingItem } from './SettingsUI';
import type { LocalCard } from '../../hooks/useLocalCards';

// --- Dice Setting ---
export const DiceSetting = ({ visible, onToggle }: { visible: boolean, onToggle: (val: boolean) => void }) => (
    <SettingItem icon={<Dices size={18} />} title="ダイスを表示">
        <SettingsToggle checked={visible} onChange={onToggle} />
    </SettingItem>
);

// --- Coin Setting ---
export const CoinSetting = ({ visible, onToggle }: { visible: boolean, onToggle: (val: boolean) => void }) => (
    <SettingItem icon={<Coins size={18} />} title="コインを表示">
        <SettingsToggle checked={visible} onChange={onToggle} />
    </SettingItem>
);

// --- Card Setting ---
interface CardSettingProps {
    visible: boolean;
    onToggle: (val: boolean) => void;
    isOpen: boolean;
    onToggleOpen: () => void;
    hasAccess: boolean;
    rootHandleName?: string;
    localCards?: LocalCard[];
    mergeSameFileCards: boolean;
    onToggleMergeSameFileCards: (val: boolean) => void;
    isScanning: boolean;
    onDropAccess: () => void;
    onRequestAccess: () => void;
    onVerifyPermission: () => void;
    cardCount: number;
}

export const CardSetting = ({
    visible, onToggle, isOpen, onToggleOpen, hasAccess, rootHandleName, localCards,
    mergeSameFileCards, onToggleMergeSameFileCards, isScanning, onDropAccess,
    onRequestAccess, onVerifyPermission, cardCount
}: CardSettingProps) => (
    <div className="flex flex-col bg-white/5 rounded-xl border border-white/5 transition-all outline-none">
        <div className="flex items-center justify-between p-[6px] px-[16px] hover:bg-white/10 rounded-xl group transition-all">
            <div className="flex items-center gap-[12px] cursor-pointer flex-1" onClick={onToggleOpen}>
                <div className="p-[8px] rounded-lg bg-black/40 text-gray-400 group-hover:text-secondary transition-colors">
                    <RectangleVertical size={18} />
                </div>
                <div className="flex items-center gap-[8px]">
                    <h3 className="text-[15px] font-semibold text-gray-200 group-hover:text-white transition-colors">カードを表示</h3>
                    <ChevronRight size={16} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                </div>
            </div>
            <SettingsToggle checked={visible} onChange={onToggle} />
        </div>

        {isOpen && (
            <div className="pl-[46px] pr-[16px] pt-[0px] pb-[4px] mt-[0px] animate-in slide-in-from-top-2 duration-200">
                <div className="py-[1px] flex flex-col gap-[2px]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-[14px] font-semibold text-gray-200">・表示フォルダ選択</h4>
                            {hasAccess ? (
                                <p className="text-[11px] text-gray-400 mt-[4px] ml-[12px]">
                                    接続先: <span className="text-gray-100">{rootHandleName || '不明'}</span> | 枚数: <span className="text-blue-400 font-bold tracking-widest">
                                        {(() => {
                                            if (!localCards) return 0;
                                            let displayCards = localCards.filter(c => !c._linkedFrom && c.path.split('/').length === 3);
                                            if (mergeSameFileCards) {
                                                const seen = new Set<string>();
                                                displayCards = displayCards.filter(c => {
                                                    if (seen.has(c.name)) return false;
                                                    seen.add(c.name);
                                                    return true;
                                                });
                                            }
                                            return displayCards.length;
                                        })()}枚</span>
                                </p>
                            ) : rootHandleName ? (
                                <div className="space-y-[2px] mt-[4px] ml-[12px]">
                                    <p className="text-[11px] text-red-400 font-bold flex items-center gap-[4px]">
                                        <Info size={12} /> 再接続が必要です
                                    </p>
                                    <p className="text-[10px] text-gray-400">接続先: <span className="text-gray-200">{rootHandleName}</span></p>
                                </div>
                            ) : (
                                <p className="text-[11px] text-gray-400 mt-[4px] ml-[12px]">フォルダ未接続</p>
                            )}
                        </div>
                        <div className="flex gap-[8px] shrink-0">
                            {(hasAccess || rootHandleName) && (
                                <button onClick={onDropAccess} className="px-[12px] py-[6px] bg-red-500/5 border border-red-500/20 text-red-400/80 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 rounded-lg font-bold text-[11px] transition-all cursor-pointer pointer-events-auto z-50 shadow-sm">
                                    解除
                                </button>
                            )}
                            <button
                                onClick={hasAccess ? onRequestAccess : (rootHandleName ? onVerifyPermission : onRequestAccess)}
                                disabled={isScanning}
                                className={`px-[12px] py-[6px] rounded-lg font-bold text-[11px] transition-all disabled:opacity-50 flex items-center gap-[6px] cursor-pointer pointer-events-auto z-50 border shadow-sm ${!hasAccess && rootHandleName ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-500/80 hover:bg-yellow-500/20 hover:text-yellow-400 hover:border-yellow-500/40' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20'}`}
                            >
                                {isScanning ? <><RefreshCw size={14} className="animate-spin" />スキャン中</> : hasAccess ? '別フォルダを選択' : rootHandleName ? 'アクセスを許可' : 'フォルダを選択'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="py-[1px] flex items-center justify-between">
                    <h4 className="text-[14px] font-semibold text-gray-200">・同名ファイルの統合</h4>
                    <SettingsToggle checked={mergeSameFileCards} onChange={onToggleMergeSameFileCards} />
                </div>

                {hasAccess && cardCount > 0 && localCards && (
                    <div className="py-[1px] flex items-center justify-between">
                        <h4 className="text-[14px] font-semibold text-gray-200 whitespace-nowrap">・表示カード選択画面を開く</h4>
                        <div className="flex gap-[6px] shrink-0">
                            <button onClick={() => window.open(window.location.origin + window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + 'view=search', '_blank')} className="px-[12px] py-[6px] bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 rounded-lg font-bold text-[11px] transition-all cursor-pointer pointer-events-auto z-50 flex items-center gap-[6px] shadow-sm">
                                別タブ
                            </button>
                            <button
                                onClick={() => {
                                    const width = 1200; const height = 800;
                                    const left = (window.screen.width - width) / 2; const top = (window.screen.height - height) / 2;
                                    window.open(window.location.origin + window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + 'view=search', 'CardSearchWindow', `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`);
                                }}
                                className="px-[12px] py-[6px] bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 rounded-lg font-bold text-[11px] transition-all cursor-pointer pointer-events-auto z-50 flex items-center gap-[6px] shadow-sm"
                            >
                                別窓
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
);

// --- Yugioh Section ---
export const YugiohSection = ({
    isOpen, onToggleOpen, isLPVisible, onToggleLPVisible, isLPSectionOpen, onToggleLPSectionOpen,
    onlyShowPlayer1, onToggleOnlyShowPlayer1, initialLP, onChangeInitialLP
}: {
    isOpen: boolean, onToggleOpen: () => void, isLPVisible: boolean, onToggleLPVisible: (val: boolean) => void,
    isLPSectionOpen: boolean, onToggleLPSectionOpen: () => void, onlyShowPlayer1: boolean, onToggleOnlyShowPlayer1: (val: boolean) => void,
    initialLP: number, onChangeInitialLP: (val: number) => void
}) => (
    <div className="relative flex flex-col transition-all outline-none">
        <div className="flex items-center justify-between py-[6px] px-[8px] hover:bg-white/5 rounded-xl group transition-all cursor-pointer relative z-10" onClick={onToggleOpen}>
            <div className="flex items-center gap-[10px] flex-1">
                <RectangleVertical size={18} className="text-blue-400 group-hover:text-blue-300 transition-colors drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                <div className="flex items-center gap-[8px]">
                    <h3 className="text-[15px] font-bold text-gray-300 group-hover:text-white tracking-wide uppercase">遊戯王</h3>
                    <ChevronRight size={16} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                </div>
            </div>
        </div>
        {isOpen && (
            <div className="pt-[0px] pb-[4px] space-y-[4px] animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col bg-white/5 rounded-xl border border-white/5 transition-all outline-none">
                    <div className="flex items-center justify-between p-[6px] px-[16px] hover:bg-white/10 rounded-xl group transition-all">
                        <div className="flex items-center gap-[12px] cursor-pointer flex-1" onClick={onToggleLPSectionOpen}>
                            <div className="p-[8px] rounded-lg bg-black/40 text-gray-400 group-hover:text-red-400 transition-colors">
                                <Heart size={18} />
                            </div>
                            <div className="flex items-center gap-[8px]">
                                <h3 className="text-[15px] font-semibold text-gray-200 group-hover:text-white transition-colors">ライフポイントを表示</h3>
                                <ChevronRight size={16} className={`text-gray-500 transition-transform duration-300 ${isLPSectionOpen ? 'rotate-90' : ''}`} />
                            </div>
                        </div>
                        <SettingsToggle checked={isLPVisible} onChange={onToggleLPVisible} />
                    </div>
                    {isLPSectionOpen && (
                        <div className="pl-[46px] pr-[16px] pt-[0px] pb-[4px] mt-[0px] animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-[2px]">
                                <div className="py-[1px] flex items-center justify-between">
                                    <h4 className="text-[14px] font-semibold text-gray-200">・Player1のみ表示</h4>
                                    <SettingsToggle checked={onlyShowPlayer1} onChange={onToggleOnlyShowPlayer1} />
                                </div>
                                <div className="py-[1px] flex items-center justify-between">
                                    <h4 className="text-[14px] font-semibold text-gray-200">・初期ライフポイント</h4>
                                    <input type="number" value={initialLP} onChange={(e) => onChangeInitialLP(parseInt(e.target.value, 10) || 0)} className="w-[80px] bg-black/40 border border-white/10 rounded px-2 py-1 text-right text-sm text-blue-400 font-bold ml-[16px]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
);

// --- Hololive Section ---
export const HololiveSection = ({
    isOpen, onToggleOpen, spMarkerMode, onToggleSPMarkerMode
}: {
    isOpen: boolean, onToggleOpen: () => void, spMarkerMode: 'off' | 'follow' | 'independent', onToggleSPMarkerMode: () => void
}) => (
    <div className="relative flex flex-col transition-all outline-none">
        <div className="flex items-center justify-between py-[6px] px-[8px] hover:bg-white/5 rounded-xl group transition-all cursor-pointer relative z-10" onClick={onToggleOpen}>
            <div className="flex items-center gap-[10px] flex-1">
                <RectangleVertical size={18} className="text-cyan-400 group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]" />
                <div className="flex items-center gap-[8px]">
                    <h3 className="text-[15px] font-bold text-gray-300 group-hover:text-white tracking-wide uppercase">ホロライブ</h3>
                    <ChevronRight size={16} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                </div>
            </div>
        </div>
        {isOpen && (
            <div className="pt-[0px] pb-[4px] space-y-[4px] animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col bg-white/5 rounded-xl border border-white/5 transition-all outline-none">
                    <div className="flex items-center justify-between p-[6px] px-[16px] hover:bg-white/10 rounded-xl group transition-all">
                        <div className="flex items-center gap-[12px] flex-1">
                            <div className="p-[8px] rounded-lg bg-black/40 text-gray-400 group-hover:text-yellow-400 transition-colors">
                                <Sparkles size={18} />
                            </div>
                            <div className="flex items-center gap-[8px]">
                                <h3 className="text-[15px] font-semibold text-gray-200 group-hover:text-white transition-colors">SPマーカーを表示</h3>
                            </div>
                        </div>
                        <SettingsToggle checked={spMarkerMode !== 'off'} onChange={onToggleSPMarkerMode} />
                    </div>
                </div>
            </div>
        )}
    </div>
);
