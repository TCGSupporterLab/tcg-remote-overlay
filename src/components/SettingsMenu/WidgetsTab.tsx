import { Settings2, Layers, Settings } from 'lucide-react';
import { SectionHeader } from './SettingsUI';
import { DiceSetting, CoinSetting, CardSetting, YugiohSection, HololiveSection } from './WidgetSections';
import type { LocalCard } from '../../hooks/useLocalCards';

interface WidgetsTabProps {
    isDiceVisible: boolean;
    onToggleDiceVisible: (val: boolean) => void;
    isCoinVisible: boolean;
    onToggleCoinVisible: (val: boolean) => void;
    isCardWidgetVisible: boolean;
    onToggleCardWidgetVisible: (val: boolean) => void;
    metadataOrder?: Record<string, Record<string, string[]>>;
    // Persistence props
    isCardSectionOpen: boolean;
    onToggleCardSectionOpen: () => void;
    isYugiohSectionOpen: boolean;
    onToggleYugiohSectionOpen: () => void;
    isHololiveSectionOpen: boolean;
    onToggleHololiveSectionOpen: () => void;
    isLPSectionOpen: boolean;
    onToggleLPSectionOpen: () => void;
    // Data & Actions
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
    // Yugioh Specific
    isLPVisible: boolean;
    onToggleLPVisible: (val: boolean) => void;
    onlyShowPlayer1: boolean;
    onToggleOnlyShowPlayer1: (val: boolean) => void;
    initialLP: number;
    onChangeInitialLP: (val: number) => void;
    // Hololive Specific
    isSPMarkerVisible: boolean;
    onToggleSPMarkerMode: () => void;
}

export const WidgetsTab = (props: WidgetsTabProps) => {
    return (
        <div className="space-y-[12px] pb-[20px]">
            {/* 汎用ウィジェット */}
            <div className="space-y-[4px]">
                <SectionHeader icon={<Settings2 size={20} />} title="汎用ウィジェット" />
                <DiceSetting visible={props.isDiceVisible} onToggle={props.onToggleDiceVisible} />
                <CoinSetting visible={props.isCoinVisible} onToggle={props.onToggleCoinVisible} />
                <CardSetting
                    visible={props.isCardWidgetVisible}
                    onToggle={props.onToggleCardWidgetVisible}
                    isOpen={props.isCardSectionOpen}
                    onToggleOpen={props.onToggleCardSectionOpen}
                    hasAccess={props.hasAccess}
                    rootHandleName={props.rootHandleName}
                    localCards={props.localCards}
                    mergeSameFileCards={props.mergeSameFileCards}
                    onToggleMergeSameFileCards={props.onToggleMergeSameFileCards}
                    isScanning={props.isScanning}
                    onDropAccess={props.onDropAccess}
                    onRequestAccess={props.onRequestAccess}
                    onVerifyPermission={props.onVerifyPermission}
                    cardCount={props.cardCount}
                />
            </div>

            {/* 専用ウィジェット */}
            <div className="space-y-[4px]">
                <SectionHeader icon={<Settings2 size={20} />} title="専用ウィジェット" borderTop />
                <div className="space-y-[4px]">
                    <YugiohSection
                        isOpen={props.isYugiohSectionOpen}
                        onToggleOpen={props.onToggleYugiohSectionOpen}
                        isLPVisible={props.isLPVisible}
                        onToggleLPVisible={props.onToggleLPVisible}
                        isLPSectionOpen={props.isLPSectionOpen}
                        onToggleLPSectionOpen={props.onToggleLPSectionOpen}
                        onlyShowPlayer1={props.onlyShowPlayer1}
                        onToggleOnlyShowPlayer1={props.onToggleOnlyShowPlayer1}
                        initialLP={props.initialLP}
                        onChangeInitialLP={props.onChangeInitialLP}
                    />
                    <HololiveSection
                        isOpen={props.isHololiveSectionOpen}
                        onToggleOpen={props.onToggleHololiveSectionOpen}
                        isSPMarkerVisible={props.isSPMarkerVisible}
                        onToggleSPMarkerMode={props.onToggleSPMarkerMode}
                    />
                </div>
            </div>

            {/* 共通設定 */}
            <div className="space-y-[4px]">
                <SectionHeader icon={<Settings size={20} />} title="共通設定" borderTop />
                <div className="space-y-[4px]">
                    <div className="flex flex-col bg-white/5 rounded-xl border border-white/5 transition-all outline-none p-[6px] px-[16px] py-[10px]">
                        <div className="flex items-center gap-[12px] mb-[8px]">
                            <div className="p-[8px] rounded-lg bg-black/40 text-gray-400 transition-colors">
                                <Layers size={18} />
                            </div>
                            <h3 className="text-[15px] font-semibold text-gray-200">優先表示順</h3>
                        </div>
                        <div className="text-xs text-gray-500 bg-black/40 p-[12px] rounded-lg border border-white/10 flex items-center justify-center">
                            準備中...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
