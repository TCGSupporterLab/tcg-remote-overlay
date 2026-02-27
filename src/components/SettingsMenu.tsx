import { useEffect, useState } from 'react';
import { X, Settings } from 'lucide-react';
import type { VideoSourceType } from '../types/widgetTypes';
import type { LocalCard } from '../hooks/useLocalCards';

// Refactored Components
import { GuideTab } from './SettingsMenu/GuideTab';
import { WidgetsTab } from './SettingsMenu/WidgetsTab';
import { VideoTab } from './SettingsMenu/VideoTab';
import { AboutTab } from './SettingsMenu/AboutTab';
import { SettingsTabs, type TabType } from './SettingsMenu/SettingsTabs';
import { MyLayoutTab } from './SettingsMenu/MyLayoutTab';

type ObsMode = 'normal' | 'green';
type DisplayPreset = 'yugioh' | 'hololive' | 'none';

interface SettingsMenuProps {
    onClose: () => void;
    // Video Props
    videoSource: VideoSourceType;
    onVideoSourceChange: (source: VideoSourceType) => void;
    isAdjustingVideo: boolean;
    onToggleVideoAdjust: () => void;
    // Core App Props
    activePreset: DisplayPreset;
    onPresetChange: (preset: DisplayPreset) => void;
    obsMode: ObsMode;
    onObsModeChange: (mode: ObsMode) => void;
    // Layout Prop
    onOpenSaveDialog: (source: 'video-menu' | 'settings', initialOptions?: { includeWidgets: boolean, includeVideo: boolean, hideOthers: boolean }) => void;
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
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
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
    onlyShowPlayer1: boolean;
    onToggleOnlyShowPlayer1: (val: boolean) => void;
    // SP Marker
    isSPMarkerVisible: boolean;
    onToggleSPMarkerMode: () => void;
    onVerifyPermission: () => void;
    onResetWidgetPosition: (id: string) => void;
    onFullReset: () => void;
    hideSettingsOnStart: boolean;
    onToggleHideSettingsOnStart: (val: boolean) => void;
    cardMode: 'library' | 'simple';
    onCardModeChange: (mode: 'library' | 'simple') => void;
    onSelectSimpleCard: () => void;
    onClearSimpleCard: () => void;
    simpleCardImageName?: string;
}

export const SettingsMenu = (props: SettingsMenuProps) => {

    // Persistent Section States (Kept here as it spans multiple potential overlays/logic)
    const [isCardSectionOpen, setIsCardSectionOpen] = useState(() => {
        const saved = localStorage.getItem('settings_isCardSectionOpen');
        return saved !== null ? saved === 'true' : true;
    });
    const [isYugiohSectionOpen, setIsYugiohSectionOpen] = useState(() => {
        const saved = localStorage.getItem('settings_isYugiohSectionOpen');
        return saved !== null ? saved === 'true' : false;
    });
    const [isHololiveSectionOpen, setIsHololiveSectionOpen] = useState(() => {
        const saved = localStorage.getItem('settings_isHololiveSectionOpen');
        return saved !== null ? saved === 'true' : false;
    });
    const [isLPSectionOpen, setIsLPSectionOpen] = useState(() => {
        const saved = localStorage.getItem('settings_isLPSectionOpen');
        return saved !== null ? saved === 'true' : false;
    });
    const [isOrderSectionOpen, setIsOrderSectionOpen] = useState(() => {
        const saved = localStorage.getItem('settings_isOrderSectionOpen');
        return saved !== null ? saved === 'true' : false;
    });

    const [isGenericCategoryOpen, setIsGenericCategoryOpen] = useState(() => {
        const saved = localStorage.getItem('settings_isGenericCategoryOpen');
        return saved !== null ? saved === 'true' : true;
    });
    const [isSpecializedCategoryOpen, setIsSpecializedCategoryOpen] = useState(() => {
        const saved = localStorage.getItem('settings_isSpecializedCategoryOpen');
        return saved !== null ? saved === 'true' : true;
    });
    const [isCommonCategoryOpen, setIsCommonCategoryOpen] = useState(() => {
        const saved = localStorage.getItem('settings_isCommonCategoryOpen');
        return saved !== null ? saved === 'true' : true;
    });

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem('settings_isCardSectionOpen', String(isCardSectionOpen));
    }, [isCardSectionOpen]);

    useEffect(() => {
        localStorage.setItem('settings_isYugiohSectionOpen', String(isYugiohSectionOpen));
    }, [isYugiohSectionOpen]);

    useEffect(() => {
        localStorage.setItem('settings_isHololiveSectionOpen', String(isHololiveSectionOpen));
    }, [isHololiveSectionOpen]);

    useEffect(() => {
        localStorage.setItem('settings_isLPSectionOpen', String(isLPSectionOpen));
    }, [isLPSectionOpen]);

    useEffect(() => {
        localStorage.setItem('settings_isOrderSectionOpen', String(isOrderSectionOpen));
    }, [isOrderSectionOpen]);

    useEffect(() => {
        localStorage.setItem('settings_isGenericCategoryOpen', String(isGenericCategoryOpen));
    }, [isGenericCategoryOpen]);

    useEffect(() => {
        localStorage.setItem('settings_isSpecializedCategoryOpen', String(isSpecializedCategoryOpen));
    }, [isSpecializedCategoryOpen]);

    useEffect(() => {
        localStorage.setItem('settings_isCommonCategoryOpen', String(isCommonCategoryOpen));
    }, [isCommonCategoryOpen]);

    // Escape key to close settings
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                props.onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [props.onClose]);

    return (
        <div
            className="fixed inset-0 z-[3000] bg-black/85 backdrop-blur-2xl flex items-center justify-center pointer-events-auto p-[64px] settings-overlay"
            onClick={props.onClose}
        >
            <div
                className="settings-window bg-[#090a10] border-2 border-white/20 rounded-[2rem] shadow-[0_0_150px_rgba(0,0,0,1)] w-[820px] h-[720px] max-w-full max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="flex justify-between items-center p-[0px] px-[36px] border-b border-border/50 bg-black/40">
                    <h2 className="text-xl font-bold flex items-center gap-[8px] py-[16px]">
                        <Settings size={20} className="text-secondary" />
                        TCG Remote Overlay Settings
                    </h2>
                    <div className="flex items-center gap-[16px]">
                        <label className="flex items-center gap-[8px] cursor-pointer group py-[4px] px-[12px] bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
                            <input
                                type="checkbox"
                                checked={props.hideSettingsOnStart}
                                onChange={(e) => props.onToggleHideSettingsOnStart(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-black/40 text-blue-600 focus:ring-blue-500 focus:ring-offset-black"
                            />
                            <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200 transition-colors">
                                アクセス時に非表示
                            </span>
                        </label>
                        <button
                            onClick={props.onClose}
                            className="p-[8px] hover:bg-white/10 rounded-full transition-colors group"
                        >
                            <X size={24} className="text-gray-400 group-hover:text-white" />
                        </button>
                    </div>
                </div>

                {/* Top Level Nav Tabs */}
                <SettingsTabs activeTab={props.activeTab} onTabChange={props.onTabChange} />

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-[8px] scrollbar-thin">
                        {props.activeTab === 'guide' && <GuideTab />}

                        {props.activeTab === 'layout' && <MyLayoutTab onOpenSaveDialog={props.onOpenSaveDialog} />}

                        {props.activeTab === 'widgets' && (
                            <WidgetsTab
                                {...props}
                                isCardSectionOpen={isCardSectionOpen}
                                onToggleCardSectionOpen={() => setIsCardSectionOpen(!isCardSectionOpen)}
                                isYugiohSectionOpen={isYugiohSectionOpen}
                                onToggleYugiohSectionOpen={() => setIsYugiohSectionOpen(!isYugiohSectionOpen)}
                                isHololiveSectionOpen={isHololiveSectionOpen}
                                onToggleHololiveSectionOpen={() => setIsHololiveSectionOpen(!isHololiveSectionOpen)}
                                isLPSectionOpen={isLPSectionOpen}
                                onToggleLPSectionOpen={() => setIsLPSectionOpen(!isLPSectionOpen)}
                                isOrderSectionOpen={isOrderSectionOpen}
                                onToggleOrderSectionOpen={() => setIsOrderSectionOpen(!isOrderSectionOpen)}
                                isGenericCategoryOpen={isGenericCategoryOpen}
                                onToggleGenericCategoryOpen={() => setIsGenericCategoryOpen(!isGenericCategoryOpen)}
                                isSpecializedCategoryOpen={isSpecializedCategoryOpen}
                                onToggleSpecializedCategoryOpen={() => setIsSpecializedCategoryOpen(!isSpecializedCategoryOpen)}
                                isCommonCategoryOpen={isCommonCategoryOpen}
                                onToggleCommonCategoryOpen={() => setIsCommonCategoryOpen(!isCommonCategoryOpen)}
                                cardMode={props.cardMode}
                                onCardModeChange={props.onCardModeChange}
                                onSelectSimpleCard={props.onSelectSimpleCard}
                                onClearSimpleCard={props.onClearSimpleCard}
                                simpleCardImageName={props.simpleCardImageName}
                                onFullReset={props.onFullReset}
                            />
                        )}

                        {props.activeTab === 'video' && (
                            <VideoTab
                                videoSource={props.videoSource}
                                onVideoSourceChange={props.onVideoSourceChange}
                                isAdjustingVideo={props.isAdjustingVideo}
                                onToggleVideoAdjust={props.onToggleVideoAdjust}
                                onOpenSaveDialog={props.onOpenSaveDialog}
                                obsMode={props.obsMode}
                                onObsModeChange={props.onObsModeChange}
                            />
                        )}

                        {props.activeTab === 'about' && <AboutTab />}
                    </div>
                </div>
            </div>
        </div>
    );
};
