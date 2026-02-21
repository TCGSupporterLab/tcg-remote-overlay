import React, { useState, useEffect } from 'react';
import { useCardSearch } from '../../hooks/useCardSearch';
import { SearchTab } from './SearchTab';
import { PinnedTab } from './PinnedTab';
import { FilterPanel } from './FilterPanel';
import { PinBadge } from './PinBadge';
import { OverlayBadge } from './OverlayBadge';
import { DisplayModeBadge } from './DisplayModeBadge';
import { SPMarkerBadge } from './SPMarkerBadge';
import { Search, Pin } from 'lucide-react';
import { OVERLAY_CARD_RADIUS } from '../HololiveTools';
import type { LocalCard } from '../../hooks/useLocalCards';

export interface CardSearchContainerProps {
    localCards?: LocalCard[];
    metadataOrder?: Record<string, string[]>;
    folderMetadataMap?: Map<string, any>;
}

export const CardSearchContainer: React.FC<CardSearchContainerProps> = ({
    localCards = [],
    folderMetadataMap = new Map()
}) => {
    const {
        filters,
        searchKey,
        currentPath,
        setCurrentPath,
        filteredCards,
        pinnedCards,
        pinnedUniqueKeys,
        selectedCard,
        overlayMode,
        updateFilter,
        setKeyword,
        togglePin,
        resetPins,
        reorderPins,
        setSelectedCard,
        toggleOverlayMode,
        overlayDisplayMode,
        toggleOverlayDisplayMode,
        spMarkerMode,
        toggleSPMarkerMode,
        dynamicFilterOptions
    } = useCardSearch(localCards, folderMetadataMap);

    const [activeTab, setActiveTab] = useState<'search' | 'pinned'>('search');

    const searchTabRef = React.useRef<{ scrollToTop: () => void; scrollToBottom: () => void; }>(null);
    const pinnedTabRef = React.useRef<{ scrollToTop: () => void; scrollToBottom: () => void; }>(null);

    const handleScrollTop = () => {
        if (activeTab === 'search') searchTabRef.current?.scrollToTop();
        else pinnedTabRef.current?.scrollToTop();
    };
    const handleScrollBottom = () => {
        if (activeTab === 'search') searchTabRef.current?.scrollToBottom();
        else pinnedTabRef.current?.scrollToBottom();
    };

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                if (e.key === 'Tab') {
                    // Do not prevent default for Tab in input, let focus move normally
                } else {
                    return;
                }
            }

            if (e.key === 'Tab') {
                e.preventDefault();
                setActiveTab(prev => prev === 'search' ? 'pinned' : 'search');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSelectCard = (card: any) => {
        if (card.isFolder) {
            setCurrentPath(card.folderPath || '');
            setActiveTab('search');
        } else {
            setSelectedCard(card);
        }
    };

    return (
        <div className="flex h-full w-full bg-gray-900 text-gray-100 overflow-hidden relative">
            {/* LEFT SIDEBAR: Detail View Only */}
            <div
                className="flex-none flex flex-col border-r border-gray-700 bg-gray-900/50 p-4"
                style={{ width: '420px', minWidth: '420px', maxWidth: '420px' }}
            >
                {selectedCard ? (
                    <div className="flex flex-col h-full animate-in fade-in duration-300">
                        {/* Enlarged Image Area */}
                        <div className="relative w-full flex-1 min-h-0 flex items-center justify-center card-hover-group overflow-hidden cursor-pointer"
                            onDoubleClick={() => selectedCard && togglePin(selectedCard)}
                            style={{ borderRadius: OVERLAY_CARD_RADIUS }}>
                            <img
                                src={selectedCard.resolvedImageUrl || selectedCard.imageUrl}
                                alt={selectedCard.name}
                                className="max-w-full max-h-full object-contain drop-shadow-2xl"
                                style={{ borderRadius: OVERLAY_CARD_RADIUS }}
                            />

                            {/* Detail View Pin Badge (Hover) */}
                            <PinBadge
                                isPinned={pinnedUniqueKeys.has(`${selectedCard.id}-${selectedCard.imageUrl}`)}
                                onToggle={() => selectedCard && togglePin(selectedCard)}
                            />

                            {/* Detail View Overlay Badge (Hover) */}
                            <OverlayBadge
                                mode={overlayMode}
                                onToggle={() => toggleOverlayMode()}
                            />

                            {/* Detail View Display Mode Badge (Hover) */}
                            <DisplayModeBadge
                                mode={overlayDisplayMode}
                                onToggle={() => toggleOverlayDisplayMode()}
                            />

                            {/* Detail View SP Marker Badge (Hover) */}
                            <SPMarkerBadge
                                mode={spMarkerMode}
                                onToggle={() => toggleSPMarkerMode()}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                        <Search size={48} className="opacity-20" />
                        <p>リストからカードを選択してください</p>
                    </div>
                )}
            </div>

            {/* RIGHT MAIN AREA: Tabs & Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-900">
                {/* File System Path / Breadcrumbs */}
                <div className="flex-none p-2 bg-gray-800 border-b border-gray-700 flex items-center gap-1 overflow-x-auto scrollbar-none no-scrollbar">
                    <button
                        onClick={() => setCurrentPath('')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${!currentPath ? 'text-cyan-400 font-bold bg-cyan-400/10' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                    >
                        ROOT
                    </button>
                    {currentPath.split('/').filter(Boolean).map((part, idx, arr) => (
                        <React.Fragment key={idx}>
                            <span className="text-gray-600 text-[10px] mx-[5px]">/</span>
                            <button
                                onClick={() => {
                                    const path = arr.slice(0, idx + 1).join('/');
                                    setCurrentPath(path);
                                }}
                                className={`text-xs px-2 py-1 rounded transition-colors whitespace-nowrap ${idx === arr.length - 1 ? 'text-cyan-400 font-bold bg-cyan-400/5' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                            >
                                {part}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                {/* Header / Tabs */}
                <div className="flex-none bg-gray-800 border-b border-gray-700 flex items-center">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-bold transition-colors border-r border-gray-700 ${activeTab === 'search'
                            ? 'bg-blue-600 text-white'
                            : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Search size={18} />
                        カード検索
                        <span className="bg-gray-900 text-gray-400 text-xs px-2 py-0.5 rounded-full ml-1 min-w-[3.5rem] text-center inline-block">
                            {filteredCards.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('pinned')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-bold transition-colors border-r border-gray-700 ${activeTab === 'pinned'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Pin size={18} />
                        ピン留め
                        <span className={`text-xs px-2 py-0.5 rounded-full ml-1 min-w-[3.5rem] text-center inline-block ${pinnedCards.length > 0 ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-500'}`}>
                            {pinnedCards.length}
                        </span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative bg-gray-900 flex flex-col">
                    {/* Show Filter Panel ONLY in Search Tab (moved from sidebar) */}
                    {activeTab === 'search' && (
                        <div className="flex-none bg-gray-900 border-b border-gray-700 p-2 z-10">
                            <FilterPanel
                                filters={filters}
                                options={dynamicFilterOptions}
                                onUpdate={updateFilter}
                                onKeywordChange={setKeyword}
                                onScrollTop={handleScrollTop}
                                onScrollBottom={handleScrollBottom}
                            />
                        </div>
                    )}

                    {/* Tab Content */}
                    <div className="flex-1 relative min-h-0">
                        {activeTab === 'search' ? (
                            <SearchTab
                                ref={searchTabRef}
                                filteredCards={filteredCards}
                                pinnedUniqueKeys={pinnedUniqueKeys}
                                searchKey={searchKey}
                                onTogglePin={togglePin}
                                onSelect={handleSelectCard}
                                selectedId={selectedCard?.id}
                                selectedImageUrl={selectedCard?.imageUrl}
                            />
                        ) : (
                            <PinnedTab
                                ref={pinnedTabRef}
                                pinnedCards={pinnedCards}
                                pinnedUniqueKeys={pinnedUniqueKeys}
                                onTogglePin={togglePin}
                                onSelect={handleSelectCard}
                                onResetPins={resetPins}
                                onReorderPins={reorderPins}
                                selectedId={selectedCard?.id}
                                selectedImageUrl={selectedCard?.imageUrl}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
