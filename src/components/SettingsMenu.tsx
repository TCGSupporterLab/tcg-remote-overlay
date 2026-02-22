import { useEffect, useState } from 'react';
import { Camera, Monitor, X, Settings, Settings2, RefreshCw, Layers, Info, ChevronLeft, ChevronRight, Dices, Coins, Sparkles, RectangleVertical, Heart } from 'lucide-react';
import type { VideoSourceType } from './VideoBackground';
import { CardSearchContainer } from './CardSearch/CardSearchContainer';
import type { LocalCard } from '../hooks/useLocalCards';

type ObsMode = 'normal' | 'green';
type GameMode = 'yugioh' | 'hololive' | 'none';

interface SettingsMenuProps {
    onClose: () => void;
    // Video Props
    videoSource: VideoSourceType;
    onVideoSourceChange: (source: VideoSourceType) => void;
    isAdjustingVideo: boolean;
    onToggleVideoAdjust: () => void;
    // Core App Props
    gameMode: GameMode;
    onGameModeChange: (mode: GameMode) => void;
    obsMode: ObsMode;
    onObsModeChange: (mode: ObsMode) => void;
    // File System Access Props
    hasAccess: boolean;
    rootHandleName?: string;
    cardCount: number;
    isScanning: boolean;
    onRequestAccess: () => void;
    onDropAccess: () => void;
    mergeSameFileCards: boolean;
    onToggleMergeSameFileCards: (val: boolean) => void;
    // Tab State Props (Lifted)
    activeTab: 'guide' | 'general' | 'widgets' | 'video' | 'about';
    onTabChange: (tab: 'guide' | 'general' | 'widgets' | 'video' | 'about') => void;
    // Widget Visibility
    localCards?: LocalCard[];
    metadataOrder?: Record<string, Record<string, string[]>>;
    isCardWidgetVisible: boolean;
    onToggleCardWidgetVisible: (val: boolean) => void;
    // Widget Visibility & Detailed Settings
    isDiceVisible: boolean;
    onToggleDiceVisible: (val: boolean) => void;
    isCoinVisible: boolean;
    onToggleCoinVisible: (val: boolean) => void;
    isLPVisible: boolean;
    onToggleLPVisible: (val: boolean) => void;
    initialLP: number;
    onChangeInitialLP: (val: number) => void;
    // SP Marker
    spMarkerMode: 'off' | 'follow' | 'independent';
    onToggleSPMarkerMode: () => void;
    onVerifyPermission: () => void;
}

export const SettingsMenu = ({
    onClose,
    videoSource,
    onVideoSourceChange,
    isAdjustingVideo,
    onToggleVideoAdjust,
    gameMode,
    onGameModeChange,
    obsMode,
    onObsModeChange,
    hasAccess,
    rootHandleName,
    cardCount,
    isScanning,
    onRequestAccess,
    onDropAccess,
    mergeSameFileCards,
    onToggleMergeSameFileCards,
    activeTab,
    onTabChange,
    localCards,
    metadataOrder,
    isCardWidgetVisible,
    onToggleCardWidgetVisible,
    isDiceVisible,
    onToggleDiceVisible,
    isCoinVisible,
    onToggleCoinVisible,
    isLPVisible,
    onToggleLPVisible,
    initialLP,
    onChangeInitialLP,
    spMarkerMode,
    onToggleSPMarkerMode,
    onVerifyPermission
}: SettingsMenuProps) => {

    const [isCardListOpen, setIsCardListOpen] = useState(false);
    const [isCardSectionOpen, setIsCardSectionOpen] = useState(true);
    const [isYugiohSectionOpen, setIsYugiohSectionOpen] = useState(false);
    const [isHololiveSectionOpen, setIsHololiveSectionOpen] = useState(false);
    const [isLPSectionOpen, setIsLPSectionOpen] = useState(false);

    // Escape key to close settings
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-2xl flex items-center justify-center pointer-events-auto p-[64px]"
        >
            <div className="settings-window bg-[#090a10] border-2 border-white/20 rounded-[2rem] shadow-[0_0_150px_rgba(0,0,0,1)] w-[820px] h-[720px] max-w-full max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex justify-between items-center p-[0px] px-[36px] border-b border-border/50 bg-black/40">
                    <h2 className="text-xl font-bold flex items-center gap-[8px]">
                        <Settings size={20} className="text-secondary" />
                        TCG Remote Overlay Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-[0px] hover:bg-white/10 rounded-full transition-colors group"
                    >
                        <X size={24} className="text-gray-400 group-hover:text-white" />
                    </button>
                </div>

                {/* Top Level Nav Tabs */}
                <div className="flex w-full border-b border-border/50 bg-black/20 px-[0px] pt-[0px] no-scrollbar gap-[1px]">
                    <button
                        className={`flex-1 justify-center px-[12px] py-[6px] border-b-2 font-bold transition-colors flex items-center gap-[6px] whitespace-nowrap text-base ${activeTab === 'guide' ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                        onClick={() => onTabChange('guide')}
                    >
                        <Info size={18} className="text-blue-400" />
                        操作説明
                    </button>
                    <button
                        className={`flex-1 justify-center px-[12px] py-[6px] border-b-2 font-bold transition-colors whitespace-nowrap text-base ${activeTab === 'general' ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                        onClick={() => onTabChange('general')}
                    >
                        基本設定
                    </button>
                    <button
                        className={`flex-1 justify-center px-[12px] py-[6px] border-b-2 font-bold transition-colors flex items-center gap-[6px] whitespace-nowrap text-base ${activeTab === 'widgets' ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                        onClick={() => onTabChange('widgets')}
                    >
                        ウィジェット
                    </button>
                    <button
                        className={`flex-1 justify-center px-[12px] py-[6px] border-b-2 font-bold transition-colors flex items-center gap-[6px] whitespace-nowrap text-base ${activeTab === 'video' ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                        onClick={() => onTabChange('video')}
                    >
                        映像入力
                    </button>
                    <button
                        className={`flex-1 justify-center px-[12px] py-[6px] border-b-2 font-bold transition-colors flex items-center gap-[6px] whitespace-nowrap text-base ${activeTab === 'about' ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                        onClick={() => onTabChange('about')}
                    >
                        About
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col">

                    {/* FULL SCREEN CARD LIST MODE */}
                    {isCardListOpen && activeTab === 'widgets' ? (
                        <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative animate-in slide-in-from-right-8 duration-200 m-[8px] rounded-xl border border-white/10 pb-0">
                            {/* Header */}
                            <div className="bg-black/80 px-[16px] py-[12px] border-b border-white/10 flex items-center justify-between z-10">
                                <h3 className="font-bold text-base text-white flex items-center gap-[8px]">
                                    <Layers size={18} className="text-blue-400" />
                                    カードの検索とピン留め
                                </h3>
                                <button
                                    onClick={() => setIsCardListOpen(false)}
                                    className="pl-[10px] pr-[14px] py-[6px] bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors flex items-center gap-[4px] shadow-sm tracking-widest text-gray-200 cursor-pointer pointer-events-auto"
                                    style={{ position: 'relative', zIndex: 100 }}
                                >
                                    <ChevronLeft size={16} />
                                    戻る
                                </button>
                            </div>
                            {/* Main Search UI Area */}
                            <div className="flex-1 overflow-hidden relative">
                                <CardSearchContainer localCards={localCards || []} metadataOrder={metadataOrder} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-[8px] scrollbar-thin">

                            {/* GUIDE TAB */}
                            {activeTab === 'guide' && (
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
                                                ゲームモードの選択
                                            </h3>
                                            <p className="text-xs text-white/70 ml-[22px]">
                                                「基本設定」から表示プリセットを選択できます。
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
                                                <Info size={16} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                                                OBS配信ソフト
                                            </h3>
                                            <p className="text-xs text-white/70 ml-[22px]">
                                                「GB」を選択し、OBS側でクロマキー設定を行うと背景を透過させられます。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* GENERAL TAB */}
                            {activeTab === 'general' && (
                                <div className="space-y-[24px]">
                                    <section className="space-y-[8px]">
                                        <h3 className="text-lg font-bold mb-[8px] flex items-center gap-[6px] border-b border-white/10 pb-[8px]">
                                            <Layers size={18} className="text-secondary" />
                                            ゲームモード
                                        </h3>
                                        <div className="flex gap-[8px]">
                                            <button
                                                className={`flex-1 py-[8px] px-[12px] rounded-lg font-bold transition-all text-sm ${gameMode === 'none'
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                                onClick={() => onGameModeChange('none')}
                                            >
                                                なし
                                            </button>
                                            <button
                                                className={`flex-1 py-[8px] px-[12px] rounded-lg font-bold transition-all text-sm ${gameMode === 'yugioh'
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                                onClick={() => onGameModeChange('yugioh')}
                                            >
                                                遊戯王
                                            </button>
                                            <button
                                                className={`flex-1 py-[8px] px-[12px] rounded-lg font-bold transition-all text-sm ${gameMode === 'hololive'
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                                onClick={() => onGameModeChange('hololive')}
                                            >
                                                ホロカ
                                            </button>
                                        </div>
                                    </section>

                                    <section className="space-y-[8px]">
                                        <h3 className="text-lg font-bold mb-[8px] flex items-center gap-[6px] border-b border-white/10 pb-[8px]">
                                            <Monitor size={18} className="text-secondary" />
                                            背景色
                                        </h3>
                                        <div className="flex gap-[8px]">
                                            <button
                                                className={`flex-1 py-[8px] px-[12px] rounded-lg font-bold transition-all text-sm ${obsMode === 'normal'
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                                onClick={() => onObsModeChange('normal')}
                                            >
                                                透過なし
                                            </button>
                                            <button
                                                className={`flex-1 py-[8px] px-[12px] rounded-lg font-bold transition-all text-sm ${obsMode === 'green'
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                                onClick={() => onObsModeChange('green')}
                                            >
                                                グリーンバック
                                            </button>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* WIDGETS TAB */}
                            {activeTab === 'widgets' && (
                                <div className="space-y-[32px] pb-[40px]">

                                    {/* 汎用ウィジェット */}
                                    <div className="space-y-[16px]">
                                        <div className="flex items-center gap-[12px] mb-[16px]">
                                            <div className="p-[8px] rounded-xl bg-white/5 border border-white/10 text-white shadow-lg">
                                                <Settings2 size={20} />
                                            </div>
                                            <h2 className="text-xl font-bold tracking-wide text-white drop-shadow-md">汎用ウィジェット</h2>
                                        </div>
                                        <div className="space-y-[12px]">

                                            {/* ダイスウィジェット */}
                                            <div className="flex items-center justify-between p-[12px] px-[16px] bg-white/5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group outline-none">
                                                <div className="flex items-center gap-[12px]">
                                                    <div className="p-[8px] rounded-lg bg-black/40 text-gray-400 group-hover:text-secondary transition-colors">
                                                        <Dices size={18} />
                                                    </div>
                                                    <h3 className="text-[15px] font-semibold text-gray-200 group-hover:text-white transition-colors">ダイスを表示</h3>
                                                </div>

                                                <label className="relative inline-flex items-center cursor-pointer pointer-events-auto shrink-0 z-50 ml-[16px]">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={isDiceVisible}
                                                        onChange={(e) => onToggleDiceVisible(e.target.checked)}
                                                    />
                                                    <div
                                                        className="w-[36px] h-[20px] rounded-full transition-all duration-300 flex items-center px-[2px] shadow-inner relative border border-white/10"
                                                        style={{
                                                            backgroundColor: isDiceVisible ? '#2563eb' : '#1e293b',
                                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <div
                                                            className={`bg-white rounded-full h-[16px] w-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ${isDiceVisible ? 'translate-x-[16px]' : 'translate-x-0'}`}
                                                            style={{ backgroundColor: '#ffffff' }}
                                                        ></div>
                                                    </div>
                                                </label>
                                            </div>

                                            {/* コインウィジェット */}
                                            <div className="flex items-center justify-between p-[12px] px-[16px] bg-white/5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group outline-none">
                                                <div className="flex items-center gap-[12px]">
                                                    <div className="p-[8px] rounded-lg bg-black/40 text-gray-400 group-hover:text-secondary transition-colors">
                                                        <Coins size={18} />
                                                    </div>
                                                    <h3 className="text-[15px] font-semibold text-gray-200 group-hover:text-white transition-colors">コインを表示</h3>
                                                </div>

                                                <label className="relative inline-flex items-center cursor-pointer pointer-events-auto shrink-0 z-50 ml-[16px]">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={isCoinVisible}
                                                        onChange={(e) => onToggleCoinVisible(e.target.checked)}
                                                    />
                                                    <div
                                                        className="w-[36px] h-[20px] rounded-full transition-all duration-300 flex items-center px-[2px] shadow-inner relative border border-white/10"
                                                        style={{
                                                            backgroundColor: isCoinVisible ? '#2563eb' : '#1e293b',
                                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <div
                                                            className={`bg-white rounded-full h-[16px] w-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ${isCoinVisible ? 'translate-x-[16px]' : 'translate-x-0'}`}
                                                            style={{ backgroundColor: '#ffffff' }}
                                                        ></div>
                                                    </div>
                                                </label>
                                            </div>

                                            {/* カードウィジェット */}
                                            <div className="flex flex-col bg-white/5 rounded-xl border border-white/5 transition-all outline-none">
                                                <div className="flex items-center justify-between p-[12px] px-[16px] hover:bg-white/10 rounded-xl group transition-all">
                                                    <div
                                                        className="flex items-center gap-[12px] cursor-pointer flex-1"
                                                        onClick={() => setIsCardSectionOpen(!isCardSectionOpen)}
                                                    >
                                                        <div className="p-[8px] rounded-lg bg-black/40 text-gray-400 group-hover:text-secondary transition-colors">
                                                            <RectangleVertical size={18} />
                                                        </div>
                                                        <div className="flex items-center gap-[8px]">
                                                            <h3 className="text-[15px] font-semibold text-gray-200 group-hover:text-white transition-colors">カードを表示</h3>
                                                            <ChevronRight
                                                                size={16}
                                                                className={`text-gray-500 transition-transform duration-300 ${isCardSectionOpen ? 'rotate-90' : ''}`}
                                                            />
                                                        </div>
                                                    </div>

                                                    <label className="relative inline-flex items-center cursor-pointer pointer-events-auto shrink-0 z-50 ml-[16px]">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only"
                                                            checked={isCardWidgetVisible}
                                                            onChange={(e) => onToggleCardWidgetVisible(e.target.checked)}
                                                        />
                                                        <div
                                                            className="w-[36px] h-[20px] rounded-full transition-all duration-300 flex items-center px-[2px] shadow-inner relative border border-white/10"
                                                            style={{
                                                                backgroundColor: isCardWidgetVisible ? '#2563eb' : '#1e293b',
                                                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <div
                                                                className={`bg-white rounded-full h-[16px] w-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ${isCardWidgetVisible ? 'translate-x-[16px]' : 'translate-x-0'}`}
                                                                style={{ backgroundColor: '#ffffff' }}
                                                            ></div>
                                                        </div>
                                                    </label>
                                                </div>

                                                {isCardSectionOpen && (
                                                    <div className="pl-[46px] pr-[16px] pt-[4px] pb-[8px] mt-[4px] animate-in slide-in-from-top-2 duration-200">
                                                        {/* ローカルカード画像の読み込み */}
                                                        <div className="py-[12px] flex flex-col gap-[12px]">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <h4 className="text-[14px] font-semibold text-gray-200">表示フォルダ選択</h4>
                                                                    {hasAccess ? (
                                                                        <p className="text-[11px] text-gray-400 mt-[4px]">
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
                                                                        <div className="space-y-[2px] mt-[4px]">
                                                                            <p className="text-[11px] text-red-400 font-bold flex items-center gap-[4px]">
                                                                                <Info size={12} />
                                                                                再接続が必要です
                                                                            </p>
                                                                            <p className="text-[10px] text-gray-400">
                                                                                接続先: <span className="text-gray-200">{rootHandleName}</span>
                                                                            </p>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-[11px] text-gray-400 mt-[4px]">フォルダ未接続</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-[8px] shrink-0">
                                                                    {(hasAccess || rootHandleName) && (
                                                                        <button
                                                                            onClick={onDropAccess}
                                                                            className="px-[12px] py-[8px] bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded-lg font-bold text-xs transition-all cursor-pointer pointer-events-auto z-50"
                                                                        >
                                                                            解除
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={hasAccess ? onRequestAccess : (rootHandleName ? onVerifyPermission : onRequestAccess)}
                                                                        disabled={isScanning}
                                                                        className={`px-[16px] py-[8px] rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-[6px] shadow-lg cursor-pointer pointer-events-auto z-50 ${!hasAccess && rootHandleName ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-primary hover:bg-primary/80 text-white'}`}
                                                                    >
                                                                        {isScanning ? (
                                                                            <><RefreshCw size={16} className="animate-spin" />スキャン中</>
                                                                        ) : hasAccess ? (
                                                                            '別フォルダを選択'
                                                                        ) : rootHandleName ? (
                                                                            'アクセスを許可'
                                                                        ) : (
                                                                            'フォルダを選択'
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* 同名ファイルの結合 */}
                                                        <div className="py-[12px] flex items-center justify-between">
                                                            <div>
                                                                <h4 className="text-[14px] font-semibold text-gray-200">同名ファイルの統合</h4>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer pointer-events-auto z-50 shrink-0 ml-[16px]">
                                                                <input
                                                                    type="checkbox"
                                                                    className="sr-only"
                                                                    checked={mergeSameFileCards}
                                                                    onChange={(e) => onToggleMergeSameFileCards(e.target.checked)}
                                                                />
                                                                <div
                                                                    className="w-[36px] h-[20px] rounded-full transition-all duration-300 flex items-center px-[2px] shadow-inner relative border border-white/10"
                                                                    style={{
                                                                        backgroundColor: mergeSameFileCards ? '#2563eb' : '#1e293b',
                                                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <div
                                                                        className={`bg-white rounded-full h-[16px] w-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ${mergeSameFileCards ? 'translate-x-[16px]' : 'translate-x-0'}`}
                                                                        style={{ backgroundColor: '#ffffff' }}
                                                                    ></div>
                                                                </div>
                                                            </label>
                                                        </div>

                                                        {/* 表示カード選択画面を開く */}
                                                        {hasAccess && cardCount > 0 && localCards && (
                                                            <div className="py-[12px] flex items-center justify-between">
                                                                <h4 className="text-[14px] font-semibold text-gray-200 whitespace-nowrap">表示カード選択画面を開く</h4>
                                                                <div className="flex gap-[8px] shrink-0">
                                                                    <button
                                                                        onClick={() => {
                                                                            window.open(window.location.origin + window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + 'view=search', '_blank');
                                                                        }}
                                                                        className="px-[16px] py-[8px] bg-primary hover:bg-primary/80 text-white rounded-lg font-bold text-sm transition-all shadow-lg cursor-pointer pointer-events-auto z-50 flex items-center gap-[6px]"
                                                                    >
                                                                        <Monitor size={16} />
                                                                        別タブ
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const width = 1200;
                                                                            const height = 800;
                                                                            const left = (window.screen.width - width) / 2;
                                                                            const top = (window.screen.height - height) / 2;
                                                                            window.open(
                                                                                window.location.origin + window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + 'view=search',
                                                                                'CardSearchWindow',
                                                                                `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
                                                                            );
                                                                        }}
                                                                        className="px-[12px] py-[8px] bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded-lg font-bold text-xs transition-all cursor-pointer pointer-events-auto z-50 flex items-center gap-[6px]"
                                                                    >
                                                                        <Layers size={14} />
                                                                        別ウィンドウ
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 専用ウィジェット */}
                                    <div className="space-y-[16px]">
                                        <div className="flex items-center gap-[12px] pt-[16px] border-t border-white/10 mt-[8px] mb-[16px]">
                                            <div className="p-[8px] rounded-xl bg-white/5 border border-white/10 text-white shadow-lg">
                                                <Settings2 size={20} />
                                            </div>
                                            <h2 className="text-xl font-bold tracking-wide text-white drop-shadow-md">専用ウィジェット</h2>
                                        </div>
                                        <div className="space-y-[12px]">

                                            {/* 遊戯王特化ウィジェット */}
                                            <div className="relative flex flex-col transition-all outline-none">
                                                <div className="flex items-center justify-between py-[8px] px-[8px] hover:bg-white/5 rounded-xl group transition-all cursor-pointer relative z-10" onClick={() => setIsYugiohSectionOpen(!isYugiohSectionOpen)}>
                                                    <div className="flex items-center gap-[10px] flex-1">
                                                        <RectangleVertical size={18} className="text-blue-400 group-hover:text-blue-300 transition-colors drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                                                        <div className="flex items-center gap-[8px]">
                                                            <h3 className="text-[15px] font-bold text-gray-300 group-hover:text-white tracking-wide uppercase">遊戯王</h3>
                                                            <ChevronRight
                                                                size={16}
                                                                className={`text-gray-500 transition-transform duration-300 ${isYugiohSectionOpen ? 'rotate-90' : ''}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                {isYugiohSectionOpen && (
                                                    <div className="pl-[28px] pt-[8px] pb-[8px] space-y-[12px] animate-in slide-in-from-top-2 duration-200">
                                                        {/* Life Points Widget */}
                                                        <div className="flex flex-col bg-white/5 rounded-xl border border-white/5 transition-all outline-none">
                                                            <div className="flex items-center justify-between p-[12px] px-[16px] hover:bg-white/10 rounded-xl group transition-all">
                                                                <div
                                                                    className="flex items-center gap-[12px] cursor-pointer flex-1"
                                                                    onClick={() => setIsLPSectionOpen(!isLPSectionOpen)}
                                                                >
                                                                    <div className="p-[8px] rounded-lg bg-black/40 text-gray-400 group-hover:text-red-400 transition-colors">
                                                                        <Heart size={18} />
                                                                    </div>
                                                                    <div className="flex items-center gap-[8px]">
                                                                        <h3 className="text-[15px] font-semibold text-gray-200 group-hover:text-white transition-colors">ライフポイントを表示</h3>
                                                                        <ChevronRight
                                                                            size={16}
                                                                            className={`text-gray-500 transition-transform duration-300 ${isLPSectionOpen ? 'rotate-90' : ''}`}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <label className="relative inline-flex items-center cursor-pointer pointer-events-auto shrink-0 z-50 ml-[16px]">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="sr-only"
                                                                        checked={isLPVisible}
                                                                        onChange={(e) => onToggleLPVisible(e.target.checked)}
                                                                    />
                                                                    <div
                                                                        className="w-[36px] h-[20px] rounded-full transition-all duration-300 flex items-center px-[2px] shadow-inner relative border border-white/10"
                                                                        style={{
                                                                            backgroundColor: isLPVisible ? '#2563eb' : '#1e293b',
                                                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className={`bg-white rounded-full h-[16px] w-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ${isLPVisible ? 'translate-x-[16px]' : 'translate-x-0'}`}
                                                                            style={{ backgroundColor: '#ffffff' }}
                                                                        ></div>
                                                                    </div>
                                                                </label>
                                                            </div>
                                                            {isLPSectionOpen && (
                                                                <div className="mt-[4px] ml-[16px] mr-[16px] mb-[16px] space-y-[12px] animate-in slide-in-from-top-2 duration-200 bg-black/20 p-[16px] rounded-xl border border-white/5">
                                                                    <div className="space-y-[12px]">
                                                                        <div className="flex justify-between items-center">
                                                                            <h4 className="text-[14px] font-semibold text-gray-200">初期ライフポイント</h4>
                                                                            <input
                                                                                type="number"
                                                                                value={initialLP}
                                                                                onChange={(e) => onChangeInitialLP(parseInt(e.target.value, 10) || 0)}
                                                                                className="w-[80px] bg-black/40 border border-white/10 rounded px-2 py-1 text-right text-sm text-blue-400 font-bold"
                                                                            />
                                                                        </div>
                                                                        <p className="text-[11px] text-gray-500">ライフポイントの計算式やログを設定できます</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>                                        {/* ホロライブ特化ウィジェット */}
                                            <div className="relative flex flex-col transition-all outline-none">
                                                <div className="flex items-center justify-between py-[8px] px-[8px] hover:bg-white/5 rounded-xl group transition-all cursor-pointer relative z-10" onClick={() => setIsHololiveSectionOpen(!isHololiveSectionOpen)}>
                                                    <div className="flex items-center gap-[10px] flex-1">
                                                        <RectangleVertical size={18} className="text-cyan-400 group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]" />
                                                        <div className="flex items-center gap-[8px]">
                                                            <h3 className="text-[15px] font-bold text-gray-300 group-hover:text-white tracking-wide uppercase">ホロライブ</h3>
                                                            <ChevronRight
                                                                size={16}
                                                                className={`text-gray-500 transition-transform duration-300 ${isHololiveSectionOpen ? 'rotate-90' : ''}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                {isHololiveSectionOpen && (
                                                    <div className="pl-[28px] pt-[8px] pb-[8px] space-y-[12px] animate-in slide-in-from-top-2 duration-200">
                                                        {/* SP Marker Toggle */}
                                                        <div className="flex flex-col bg-white/5 rounded-xl border border-white/5 transition-all outline-none">
                                                            <div className="flex items-center justify-between p-[12px] px-[16px] hover:bg-white/10 rounded-xl group transition-all">
                                                                <div className="flex items-center gap-[12px] flex-1">
                                                                    <div className="p-[8px] rounded-lg bg-black/40 text-gray-400 group-hover:text-yellow-400 transition-colors">
                                                                        <Sparkles size={18} />
                                                                    </div>
                                                                    <div className="flex items-center gap-[8px]">
                                                                        <h3 className="text-[15px] font-semibold text-gray-200 group-hover:text-white transition-colors">SPマーカーを表示</h3>
                                                                    </div>
                                                                </div>
                                                                <label className="relative inline-flex items-center cursor-pointer pointer-events-auto shrink-0 z-50 ml-[16px]">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="sr-only"
                                                                        checked={spMarkerMode !== 'off'}
                                                                        onChange={onToggleSPMarkerMode}
                                                                    />
                                                                    <div
                                                                        className="w-[36px] h-[20px] rounded-full transition-all duration-300 flex items-center px-[2px] shadow-inner relative border border-white/10"
                                                                        style={{
                                                                            backgroundColor: spMarkerMode !== 'off' ? '#2563eb' : '#1e293b',
                                                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className={`bg-white rounded-full h-[16px] w-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ${spMarkerMode !== 'off' ? 'translate-x-[16px]' : 'translate-x-0'}`}
                                                                            style={{ backgroundColor: '#ffffff' }}
                                                                        ></div>
                                                                    </div>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 共通設定 */}
                                    <div className="space-y-[16px]">
                                        <div className="flex items-center gap-[12px] pt-[16px] border-t border-white/10 mt-[8px] mb-[16px]">
                                            <div className="p-[8px] rounded-xl bg-white/5 border border-white/10 text-white shadow-lg">
                                                <Settings size={20} />
                                            </div>
                                            <h2 className="text-xl font-bold tracking-wide text-white drop-shadow-md">共通設定</h2>
                                        </div>
                                        <div className="space-y-[12px]">
                                            {/* 優先表示順 - Placeholder */}
                                            <div className="flex flex-col bg-white/5 rounded-xl border border-white/5 transition-all outline-none p-[16px]">
                                                <label className="text-[15px] font-semibold text-gray-200 mb-[8px] flex items-center gap-[8px]">
                                                    <Layers size={16} className="text-gray-400" />
                                                    優先表示順
                                                </label>
                                                <div className="text-xs text-gray-500 bg-black/40 p-[12px] rounded-lg border border-white/10 flex items-center justify-center">
                                                    準備中...
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* VIDEO TAB */}
                            {activeTab === 'video' && (
                                <div className="space-y-[24px]">
                                    <section className="space-y-[8px]">
                                        <h3 className="text-lg font-bold mb-[8px] flex items-center gap-[6px] border-b border-white/10 pb-[8px]">
                                            <Camera size={18} className="text-secondary" />
                                            ビデオソース
                                        </h3>

                                        <div className="grid grid-cols-3 gap-[8px]">
                                            <button
                                                className={`py-[12px] px-[8px] rounded-xl transition-all flex flex-col items-center gap-[4px] ${videoSource === 'none'
                                                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                                onClick={() => onVideoSourceChange('none')}
                                            >
                                                <X size={20} />
                                                <span className="font-bold text-sm">なし</span>
                                            </button>
                                            <button
                                                className={`py-[12px] px-[8px] rounded-xl transition-all flex flex-col items-center gap-[4px] ${videoSource === 'camera'
                                                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                                onClick={() => onVideoSourceChange('camera')}
                                            >
                                                <Camera size={20} />
                                                <span className="font-bold text-sm">カメラ</span>
                                            </button>
                                            <button
                                                className={`py-[12px] px-[8px] rounded-xl transition-all flex flex-col items-center gap-[4px] ${videoSource === 'screen'
                                                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                                onClick={() => onVideoSourceChange('screen')}
                                            >
                                                <Monitor size={20} />
                                                <span className="font-bold text-sm">画面共有</span>
                                            </button>
                                        </div>
                                    </section>

                                    {videoSource !== 'none' && (
                                        <section className="space-y-[8px] p-[16px] rounded-xl bg-white/5 border border-white/10">
                                            <h3 className="text-base font-bold">映像の調整</h3>
                                            <p className="text-xs text-gray-400">
                                                「調整モード」で移動・リサイズが可能になります。
                                            </p>
                                            <button
                                                className={`w-full py-[8px] px-[16px] rounded-lg font-bold flex justify-center items-center gap-[6px] transition-all text-sm ${isAdjustingVideo
                                                    ? 'bg-yellow-600 text-white shadow-lg animate-pulse'
                                                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'
                                                    }`}
                                                onClick={onToggleVideoAdjust}
                                            >
                                                {isAdjustingVideo ? '調整モードを終了' : '調整モードを開始'}
                                            </button>
                                        </section>
                                    )}
                                </div>
                            )}

                            {/* ABOUT TAB */}
                            {activeTab === 'about' && (
                                <div className="space-y-[16px] text-center py-[8px]">
                                    <h1 className="text-2xl font-black mb-[4px] tracking-tighter">TCG Remote Overlay</h1>
                                    <p className="text-sm text-gray-400 mb-[16px] border-b border-white/10 pb-[12px]">
                                        Version 2.0 (Next-Gen)
                                    </p>

                                    <div className="text-xs text-gray-300 space-y-[8px] text-left p-[16px] bg-white/5 rounded-xl border border-white/10">
                                        <h4 className="font-bold text-base text-white mb-[4px]">免責事項</h4>
                                        <ul className="list-disc list-inside opacity-80 leading-relaxed">
                                            <li>非公式オーバーレイツールです。</li>
                                            <li>アセットはユーザーのローカルPCからのみ読み込まれます。</li>
                                            <li>開発者は一切の責任を負いません。</li>
                                        </ul>
                                    </div>

                                    <div className="pt-[16px]">
                                        <a
                                            href="https://www.amazon.jp/hz/wishlist/ls/2GICU7N55Z5Y7?ref_=wl_share"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-block bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/50 hover:bg-[#FF9900]/30 px-[16px] py-[8px] rounded-full font-bold text-base transition-all shadow-lg"
                                        >
                                            応援する (Amazon)
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
};
