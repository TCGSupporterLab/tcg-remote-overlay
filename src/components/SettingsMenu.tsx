import { useEffect, useState } from 'react';
import { Camera, Monitor, X, Settings, RefreshCw, Layers, Info, ChevronLeft, ChevronRight, Dices, Coins, Activity, Sparkles } from 'lucide-react';
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
                                <div className="space-y-[8px] pb-[40px]">
                                    {/* 1. Dice Widget */}
                                    <section className="space-y-[0px]">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-[8px] mb-[12px] pl-[40px] pr-[70px]">
                                            <div
                                                className="flex items-center gap-[8px]"
                                            >
                                                <Dices size={18} className="text-secondary" />
                                                <h3 className="text-lg font-bold text-white">ダイスを表示</h3>
                                            </div>

                                            <label className="relative inline-flex items-center cursor-pointer pointer-events-auto shrink-0 z-50">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={isDiceVisible}
                                                    onChange={(e) => onToggleDiceVisible(e.target.checked)}
                                                />
                                                <div
                                                    className="w-[44px] h-[22px] rounded-full transition-all duration-300 flex items-center px-[2px] shadow-inner relative border border-white/10"
                                                    style={{
                                                        backgroundColor: isDiceVisible ? '#2563eb' : '#1e293b',
                                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <div
                                                        className={`bg-white rounded-full h-[18px] w-[18px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ${isDiceVisible ? 'translate-x-[22px]' : 'translate-x-0'}`}
                                                        style={{ backgroundColor: '#ffffff' }}
                                                    ></div>
                                                </div>
                                            </label>
                                        </div>
                                    </section>

                                    {/* 2. Coin Widget */}
                                    <section className="space-y-[0px]">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-[8px] mb-[12px] pl-[40px] pr-[70px]">
                                            <div
                                                className="flex items-center gap-[8px]"
                                            >
                                                <Coins size={18} className="text-secondary" />
                                                <h3 className="text-lg font-bold text-white">コインを表示</h3>
                                            </div>

                                            <label className="relative inline-flex items-center cursor-pointer pointer-events-auto shrink-0 z-50">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={isCoinVisible}
                                                    onChange={(e) => onToggleCoinVisible(e.target.checked)}
                                                />
                                                <div
                                                    className="w-[44px] h-[22px] rounded-full transition-all duration-300 flex items-center px-[2px] shadow-inner relative border border-white/10"
                                                    style={{
                                                        backgroundColor: isCoinVisible ? '#2563eb' : '#1e293b',
                                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <div
                                                        className={`bg-white rounded-full h-[18px] w-[18px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ${isCoinVisible ? 'translate-x-[22px]' : 'translate-x-0'}`}
                                                        style={{ backgroundColor: '#ffffff' }}
                                                    ></div>
                                                </div>
                                            </label>
                                        </div>
                                    </section>

                                    {/* 3. Card Widget (Integrated Existing Logic) */}
                                    <section className="space-y-[0px]">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-[8px] mb-[12px] pl-[40px] pr-[70px]">
                                            <div
                                                className="flex items-center gap-[8px] cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setIsCardSectionOpen(!isCardSectionOpen)}
                                            >
                                                <Layers size={18} className="text-secondary" />
                                                <h3 className="text-lg font-bold text-white">カードを表示</h3>
                                                <ChevronRight
                                                    size={18}
                                                    className={`text-gray-500 transition-transform duration-300 ${isCardSectionOpen ? 'rotate-90' : ''}`}
                                                />
                                            </div>

                                            <label className="relative inline-flex items-center cursor-pointer pointer-events-auto shrink-0 z-50">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={isCardWidgetVisible}
                                                    onChange={(e) => onToggleCardWidgetVisible(e.target.checked)}
                                                />
                                                <div
                                                    className="w-[44px] h-[22px] rounded-full transition-all duration-300 flex items-center px-[2px] shadow-inner relative border border-white/10"
                                                    style={{
                                                        backgroundColor: isCardWidgetVisible ? '#2563eb' : '#1e293b',
                                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <div
                                                        className={`bg-white rounded-full h-[18px] w-[18px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ${isCardWidgetVisible ? 'translate-x-[22px]' : 'translate-x-0'}`}
                                                        style={{ backgroundColor: '#ffffff' }}
                                                    ></div>
                                                </div>
                                            </label>
                                        </div>

                                        {isCardSectionOpen && (
                                            <div className="space-y-[12px] animate-in slide-in-from-top-2 duration-200">
                                                {/* ローカルカード画像の読み込み (Simple UI) */}
                                                <div className="bg-white/5 p-[16px] rounded-xl border border-white/10 space-y-[12px]">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-white mb-[4px]">
                                                                ローカルカード画像の読み込み
                                                            </h4>
                                                            {hasAccess ? (
                                                                <p className="text-xs text-gray-400">
                                                                    接続先: <span className="text-gray-100">{rootHandleName || '不明'}</span> | 枚数: <span className="text-blue-400 font-bold tracking-widest">
                                                                        {(() => {
                                                                            if (!localCards) return 0;
                                                                            // 1. 物理ファイルのみを抽出 (_linkedFrom がないもの)
                                                                            let displayCards = localCards.filter(c => !c._linkedFrom);

                                                                            // 2. 結合がONの場合は重複を除去
                                                                            if (mergeSameFileCards) {
                                                                                const seen = new Set<string>();
                                                                                displayCards = displayCards.filter(c => {
                                                                                    const name = c.name;
                                                                                    if (seen.has(name)) return false;
                                                                                    seen.add(name);
                                                                                    return true;
                                                                                });
                                                                            }
                                                                            return displayCards.length;
                                                                        })()}枚</span>
                                                                </p>
                                                            ) : rootHandleName ? (
                                                                <div className="space-y-[4px]">
                                                                    <p className="text-xs text-red-400 font-bold flex items-center gap-[4px]">
                                                                        <Info size={12} />
                                                                        再接続が必要です
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400">
                                                                        接続先: <span className="text-gray-200">{rootHandleName}</span>
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-gray-400">フォルダ未接続</p>
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
                                                                className={`px-[16px] py-[8px] rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-[6px] shadow-lg cursor-pointer pointer-events-auto z-50 ${!hasAccess && rootHandleName ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-primary hover:bg-primary/80 text-white'
                                                                    }`}
                                                            >
                                                                {isScanning ? (
                                                                    <><RefreshCw size={16} className="animate-spin" />スキャン中</>
                                                                ) : hasAccess ? (
                                                                    '再スキャン'
                                                                ) : rootHandleName ? (
                                                                    'アクセスを許可'
                                                                ) : (
                                                                    'フォルダを選択'
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* 同名ファイルの扱い設定 */}
                                                    <div className="pt-[12px] border-t border-white/10 flex items-center justify-between">
                                                        <div>
                                                            <h4 className="text-xs font-bold text-white/90 mb-[2px]">同名ファイルの結合 (階層順)</h4>
                                                            <p className="text-[10px] text-gray-500">同名画像が複数ある場合、優先スキャン順の一つだけを使用します。</p>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer pointer-events-auto z-50 shrink-0">
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
                                                                    className={`bg-white rounded-full h-[16px] w-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ${mergeSameFileCards ? 'translate-x-[18px]' : 'translate-x-0'}`}
                                                                    style={{ backgroundColor: '#ffffff' }}
                                                                ></div>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* カード選択画面の外部起動セクション（デザイン統一版） */}
                                                {hasAccess && cardCount > 0 && localCards && (
                                                    <div className="pt-[8px] bg-white/5 p-[12px] rounded-xl border border-white/10 flex items-center justify-between gap-[10px]">
                                                        <h4 className="text-sm font-bold text-white whitespace-nowrap">表示カード選択画面を開く</h4>

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
                                    </section>

                                    {/* 4. Life Points Widget */}
                                    <section className="space-y-[0px]">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-[8px] mb-[12px] pl-[40px] pr-[70px]">
                                            <div
                                                className="flex items-center gap-[8px] cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setIsLPSectionOpen(!isLPSectionOpen)}
                                            >
                                                <Activity size={18} className="text-secondary" />
                                                <h3 className="text-lg font-bold text-white">ライフポイントを表示</h3>
                                                <ChevronRight
                                                    size={18}
                                                    className={`text-gray-500 transition-transform duration-300 ${isLPSectionOpen ? 'rotate-90' : ''}`}
                                                />
                                            </div>

                                            <label className="relative inline-flex items-center cursor-pointer pointer-events-auto shrink-0 z-50">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={isLPVisible}
                                                    onChange={(e) => onToggleLPVisible(e.target.checked)}
                                                />
                                                <div
                                                    className="w-[44px] h-[22px] rounded-full transition-all duration-300 flex items-center px-[2px] shadow-inner relative border border-white/10"
                                                    style={{
                                                        backgroundColor: isLPVisible ? '#2563eb' : '#1e293b',
                                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <div
                                                        className={`bg-white rounded-full h-[18px] w-[18px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ${isLPVisible ? 'translate-x-[22px]' : 'translate-x-0'}`}
                                                        style={{ backgroundColor: '#ffffff' }}
                                                    ></div>
                                                </div>
                                            </label>
                                        </div>
                                        {isLPSectionOpen && (
                                            <div className="space-y-[12px] animate-in slide-in-from-top-2 duration-200 bg-white/5 p-[16px] rounded-xl border border-white/10">
                                                <div className="space-y-[12px]">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-sm font-bold text-white">初期ライフポイント</h4>
                                                        <input
                                                            type="number"
                                                            value={initialLP}
                                                            onChange={(e) => onChangeInitialLP(parseInt(e.target.value, 10) || 0)}
                                                            className="w-[80px] bg-black/40 border border-white/10 rounded px-2 py-1 text-right text-sm text-blue-400 font-bold"
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-gray-500">ライフポイントの計算式やログの保存期間を設定できます</p>
                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    {/* 5. SP Marker Widget */}
                                    <section className="space-y-[0px]">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-[8px] mb-[12px] pl-[40px] pr-[70px]">
                                            <div
                                                className="flex items-center gap-[8px]"
                                            >
                                                <Sparkles size={18} className="text-secondary" />
                                                <h3 className="text-lg font-bold text-white">SP推しスキルマーカーを表示</h3>
                                            </div>

                                            <label className="relative inline-flex items-center cursor-pointer pointer-events-auto shrink-0 z-50">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={spMarkerMode !== 'off'}
                                                    onChange={() => onToggleSPMarkerMode()}
                                                />
                                                <div
                                                    className="w-[44px] h-[22px] rounded-full transition-all duration-300 flex items-center px-[2px] shadow-inner relative border border-white/10"
                                                    style={{
                                                        backgroundColor: spMarkerMode !== 'off' ? '#2563eb' : '#1e293b',
                                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <div
                                                        className={`bg-white rounded-full h-[18px] w-[18px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ${spMarkerMode !== 'off' ? 'translate-x-[22px]' : 'translate-x-0'}`}
                                                        style={{ backgroundColor: '#ffffff' }}
                                                    ></div>
                                                </div>
                                            </label>
                                        </div>

                                    </section>
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
            </div>
        </div>
    );
};
