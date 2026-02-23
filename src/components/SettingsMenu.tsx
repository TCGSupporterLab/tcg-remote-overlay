import { useEffect, useState } from 'react';
import { X, Settings } from 'lucide-react';
import type { VideoSourceType } from './VideoBackground';
import type { LocalCard } from '../hooks/useLocalCards';

// Refactored Components
import { GuideTab } from './SettingsMenu/GuideTab';
import { GeneralTab } from './SettingsMenu/GeneralTab';
import { WidgetsTab } from './SettingsMenu/WidgetsTab';
import { VideoTab } from './SettingsMenu/VideoTab';
import { AboutTab } from './SettingsMenu/AboutTab';
import { SettingsTabs } from './SettingsMenu/SettingsTabs';
import type { TabType } from './SettingsMenu/SettingsTabs';

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
        <div className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-2xl flex items-center justify-center pointer-events-auto p-[64px]">
            <div className="settings-window bg-[#090a10] border-2 border-white/20 rounded-[2rem] shadow-[0_0_150px_rgba(0,0,0,1)] w-[820px] h-[720px] max-w-full max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex justify-between items-center p-[0px] px-[36px] border-b border-border/50 bg-black/40">
                    <h2 className="text-xl font-bold flex items-center gap-[8px] py-[16px]">
                        <Settings size={20} className="text-secondary" />
                        TCG Remote Overlay Settings
                    </h2>
                    <button
                        onClick={props.onClose}
                        className="p-[8px] hover:bg-white/10 rounded-full transition-colors group"
                    >
                        <X size={24} className="text-gray-400 group-hover:text-white" />
                    </button>
                </div>

                {/* Top Level Nav Tabs */}
                <SettingsTabs activeTab={props.activeTab} onTabChange={props.onTabChange} />

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-[8px] scrollbar-thin">
                        {props.activeTab === 'guide' && <GuideTab />}

                        {props.activeTab === 'general' && (
                            <GeneralTab
                                gameMode={props.gameMode}
                                onGameModeChange={props.onGameModeChange}
                                obsMode={props.obsMode}
                                onObsModeChange={props.onObsModeChange}
                            />
                        )}

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
                            />
                        )}

                        {props.activeTab === 'video' && (
                            <VideoTab
                                videoSource={props.videoSource}
                                onVideoSourceChange={props.onVideoSourceChange}
                                isAdjustingVideo={props.isAdjustingVideo}
                                onToggleVideoAdjust={props.onToggleVideoAdjust}
                            />
                        )}

                        {props.activeTab === 'about' && <AboutTab />}
                    </div>
                </div>
            </div>
        </div>
    );
};

