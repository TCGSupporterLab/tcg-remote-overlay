import { Settings2, Layers, Settings, ChevronRight, RefreshCw } from 'lucide-react';
import { SectionHeader } from './SettingsUI';
import { DiceSetting, CoinSetting, CardSetting, YugiohSection, HololiveSection } from './WidgetSections';
import { WidgetOrderUI } from './WidgetOrderUI';
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
    isLPSectionOpen: boolean;
    onToggleLPSectionOpen: () => void;
    // Card Mode
    cardMode: 'library' | 'simple';
    onCardModeChange: (mode: 'library' | 'simple') => void;
    onSelectSimpleCard: () => void;
    onClearSimpleCard: () => void;
    simpleCardImageName?: string;
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
    // Order Section
    isOrderSectionOpen: boolean;
    onToggleOrderSectionOpen: () => void;
    // Category Sections
    isGenericCategoryOpen: boolean;
    onToggleGenericCategoryOpen: () => void;
    isSpecializedCategoryOpen: boolean;
    onToggleSpecializedCategoryOpen: () => void;
    // Game Specific Sections
    isYugiohSectionOpen: boolean;
    onToggleYugiohSectionOpen: () => void;
    isHololiveSectionOpen: boolean;
    onToggleHololiveSectionOpen: () => void;
    isCommonCategoryOpen: boolean;
    onToggleCommonCategoryOpen: () => void;
    onResetWidgetPosition: (id: string) => void;
    onUnzipZIP: (file: File) => void;
    onFullReset: () => void;
}

export const WidgetsTab = (props: WidgetsTabProps) => {
    return (
        <div className="space-y-[12px] pb-[20px]">
            {/* 共通設定 */}
            <div className="space-y-[4px]">
                <SectionHeader
                    icon={<Settings size={20} />}
                    title="共通設定"
                    isOpen={props.isCommonCategoryOpen}
                    onToggle={props.onToggleCommonCategoryOpen}
                />
                {props.isCommonCategoryOpen && (
                    <div className="space-y-[4px] animate-in slide-in-from-top-2 duration-200">
                        {/* 状態リセット */}
                        <div className="flex flex-col bg-white/5 rounded-xl border border-white/5 transition-all mb-[4px]">
                            <div className="flex items-center justify-between p-[6px] px-[16px] min-h-[52px]">
                                <div className="flex items-center gap-[12px] flex-1 min-w-0">
                                    <div className="p-[8px] rounded-lg bg-black/40 text-gray-400 shrink-0">
                                        <RefreshCw size={18} />
                                    </div>
                                    <div className="flex items-center gap-[12px] min-w-0">
                                        <h3 className="text-[15px] font-semibold text-gray-200 shrink-0">状態リセット</h3>
                                        <p className="text-[11px] text-gray-400 leading-none truncate">
                                            コイン、ダイス、ライフポイント、SPマーカーの状態を初期化します。
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={props.onFullReset}
                                    className="px-[12px] py-[6px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg font-bold text-[11px] transition-all active:scale-[0.98] shadow-sm shrink-0 ml-[12px]"
                                >
                                    リセットを実行
                                </button>
                            </div>
                        </div>

                        {/* 優先表示順 */}
                        <div className="flex flex-col bg-white/5 rounded-xl border border-white/5 transition-all outline-none">
                            <div
                                className="flex items-center justify-between p-[6px] px-[16px] hover:bg-white/10 rounded-xl group transition-all cursor-pointer"
                                onClick={props.onToggleOrderSectionOpen}
                            >
                                <div className="flex items-center gap-[12px]">
                                    <div className="p-[8px] rounded-lg bg-black/40 text-gray-400 group-hover:text-secondary transition-colors">
                                        <Layers size={18} />
                                    </div>
                                    <div className="flex items-center gap-[8px]">
                                        <h3 className="text-[15px] font-semibold text-gray-200 group-hover:text-white transition-colors">優先表示順</h3>
                                        <ChevronRight size={16} className={`text-gray-500 transition-transform duration-300 ${props.isOrderSectionOpen ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>
                            </div>

                            {props.isOrderSectionOpen && (
                                <div className="px-[16px] pb-[12px] animate-in slide-in-from-top-2 duration-200">
                                    <WidgetOrderUI />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 汎用ウィジェット */}
            <div className="space-y-[4px]">
                <SectionHeader
                    icon={<Settings2 size={20} />}
                    title="汎用ウィジェット"
                    borderTop
                    isOpen={props.isGenericCategoryOpen}
                    onToggle={props.onToggleGenericCategoryOpen}
                />
                {props.isGenericCategoryOpen && (
                    <div className="space-y-[4px] animate-in slide-in-from-top-2 duration-200">
                        <DiceSetting visible={props.isDiceVisible} onToggle={props.onToggleDiceVisible} onReset={() => props.onResetWidgetPosition('dice')} />
                        <CoinSetting visible={props.isCoinVisible} onToggle={props.onToggleCoinVisible} onReset={() => props.onResetWidgetPosition('coin')} />
                        <CardSetting
                            visible={props.isCardWidgetVisible}
                            onToggle={props.onToggleCardWidgetVisible}
                            cardMode={props.cardMode}
                            onCardModeChange={props.onCardModeChange}
                            onSelectSimpleCard={props.onSelectSimpleCard}
                            onClearSimpleCard={props.onClearSimpleCard}
                            simpleCardImageName={props.simpleCardImageName}
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
                            onUnzipZIP={props.onUnzipZIP}
                            onReset={() => props.onResetWidgetPosition('card_widget')}
                        />
                    </div>
                )}
            </div>

            {/* 専用ウィジェット */}
            <div className="space-y-[4px]">
                <SectionHeader
                    icon={<Settings2 size={20} />}
                    title="専用ウィジェット"
                    borderTop
                    isOpen={props.isSpecializedCategoryOpen}
                    onToggle={props.onToggleSpecializedCategoryOpen}
                />
                {props.isSpecializedCategoryOpen && (
                    <div className="space-y-[4px] animate-in slide-in-from-top-2 duration-200">
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
                            onReset={() => props.onResetWidgetPosition('lp_calculator')}
                        />
                        <HololiveSection
                            isOpen={props.isHololiveSectionOpen}
                            onToggleOpen={props.onToggleHololiveSectionOpen}
                            isSPMarkerVisible={props.isSPMarkerVisible}
                            onToggleSPMarkerMode={props.onToggleSPMarkerMode}
                            onReset={() => props.onResetWidgetPosition('sp_marker')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
