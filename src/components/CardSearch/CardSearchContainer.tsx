import React, { useState, useEffect } from 'react';
import { useCardSearch } from '../../hooks/useCardSearch';
import { SearchTab } from './SearchTab';
import { PinnedTab } from './PinnedTab';
import { FilterPanel } from './FilterPanel';
import { PinBadge } from './PinBadge';
import { Search, Pin } from 'lucide-react';
import { OVERLAY_CARD_RADIUS } from './CardWidget';
import type { LocalCard } from '../../hooks/useLocalCards';

export interface CardSearchContainerProps {
    localCards?: LocalCard[];
    metadataOrder?: Record<string, Record<string, string[]>>;
    mergeSameFileCards?: boolean;
}

export const CardSearchContainer: React.FC<CardSearchContainerProps> = ({
    localCards = [],
    metadataOrder = {},
    mergeSameFileCards = false,
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
        updateFilter,
        setKeyword,
        togglePin,
        resetPins,
        reorderPins,
        setSelectedCard,
        dynamicFilterOptions
    } = useCardSearch(localCards, metadataOrder, mergeSameFileCards);

    const [activeTab, setActiveTab] = useState<'search' | 'pinned'>('search');

    const searchTabRef = React.useRef<{ scrollToTop: () => void; scrollToBottom: () => void; }>(null);
    const pinnedTabRef = React.useRef<{ scrollToTop: () => void; scrollToBottom: () => void; }>(null);


    // Keyboard Navigation & Global Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.key === 'Tab') {
                e.preventDefault();
                setActiveTab(prev => prev === 'search' ? 'pinned' : 'search');
                return;
            }

            // Broadcast logic with robust Shift/Numpad detection
            const isNumpad = e.code.startsWith('Numpad');
            const isDigit = /^(Digit|Numpad)[0-9]$/.test(e.code);
            const isShift = e.shiftKey || (e.getModifierState?.('Shift') ?? false);
            // High-reliability shift detection for Numpad (Windows behavior)
            const isShiftedDigit = isDigit && (isShift || (isNumpad && !/^\d$/.test(e.key)));

            if (/^[dcvAo\.]$/i.test(e.key) || e.code === 'NumpadDecimal' || isShiftedDigit) {
                e.preventDefault();
                const channel = new BroadcastChannel('tcg_remote_app_shortcuts');
                channel.postMessage({
                    type: 'remote_keydown',
                    event: {
                        key: e.key,
                        code: e.code,
                        shiftKey: true, // Force true if we matched isShiftedDigit
                        ctrlKey: e.ctrlKey,
                        altKey: e.altKey,
                        metaKey: e.metaKey,
                        repeat: e.repeat
                    }
                });
                channel.close();
                return;
            }

            // Broadcaster for LP Calculator shortcuts
            const isLPKey = /^[0-9\+\-\/\*p]$/i.test(e.key) ||
                ['Enter', 'Delete', 'Backspace', 'Add', 'Subtract', 'Divide', 'Multiply', 'Decimal'].includes(e.key) ||
                ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y'));

            if (isLPKey) {
                const channel = new BroadcastChannel('tcg_remote_sync_lp');
                channel.postMessage({
                    type: 'remote_keydown',
                    event: {
                        key: e.key,
                        code: e.code,
                        shiftKey: isShift,
                        ctrlKey: e.ctrlKey,
                        altKey: e.altKey,
                        metaKey: e.metaKey,
                        repeat: e.repeat
                    }
                });
                channel.close();
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
                        <div className="relative w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden"
                            onDoubleClick={() => selectedCard && togglePin(selectedCard)}>
                            <div className="relative w-fit h-fit flex items-center justify-center card-hover-group" style={{ borderRadius: OVERLAY_CARD_RADIUS }}>
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
                            </div>
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
                        <div className="bg-gray-900 border-b border-gray-700 p-2 z-10 w-full min-h-fit">
                            <FilterPanel
                                filters={filters}
                                options={dynamicFilterOptions}
                                onUpdate={updateFilter}
                                onKeywordChange={setKeyword}
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
