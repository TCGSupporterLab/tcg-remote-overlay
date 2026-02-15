import React, { useState, useEffect } from 'react';
import { useCardSearch, type Card } from '../../hooks/useCardSearch';
import { SearchTab } from './SearchTab';
import { PinnedTab } from './PinnedTab';
import { FilterPanel } from './FilterPanel';
import { PinBadge } from './PinBadge';
import { Search, Pin } from 'lucide-react';

export const CardSearchContainer: React.FC = () => {
    const {
        filters,
        filteredCards,
        pinnedCards,
        showPinnedOnOverlay,
        updateFilter,
        setKeyword,
        togglePin,
        resetPins,
        toggleShowPinnedOnOverlay
    } = useCardSearch();

    const [activeTab, setActiveTab] = useState<'search' | 'pinned'>('search');
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);

    // Auto-select first card if nothing selected or current selection is filtered out
    useEffect(() => {
        if (filteredCards.length > 0) {
            const isSelectedVisible = selectedCard && filteredCards.some(c => c.id === selectedCard.id);
            if (!isSelectedVisible) {
                setSelectedCard(filteredCards[0]);
            }
        } else {
            setSelectedCard(null);
        }
    }, [filteredCards, selectedCard]);

    const searchTabRef = React.useRef<{ scrollToTop: () => void; scrollToBottom: () => void; }>(null);

    const handleScrollTop = () => searchTabRef.current?.scrollToTop();
    const handleScrollBottom = () => searchTabRef.current?.scrollToBottom();

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
                        <div className="relative w-full flex-1 min-h-0 flex items-center justify-center card-hover-group">
                            <img
                                src={selectedCard.imageUrl.startsWith('/') ? selectedCard.imageUrl.slice(1) : selectedCard.imageUrl}
                                alt={selectedCard.name}
                                className="max-w-full max-h-full object-contain drop-shadow-2xl"
                            />

                            {/* Detail View Pin Badge (Hover) */}
                            <PinBadge
                                isPinned={pinnedCards.some(c => c.id === selectedCard?.id)}
                                onToggle={() => selectedCard && togglePin(selectedCard)}
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
                                pinnedCards={pinnedCards}
                                onTogglePin={togglePin}
                                onSelect={setSelectedCard}
                            />
                        ) : (
                            <PinnedTab
                                pinnedCards={pinnedCards}
                                showOnOverlay={showPinnedOnOverlay}
                                onTogglePin={togglePin}
                                onSelect={setSelectedCard}
                                onResetPins={resetPins}
                                onToggleOverlay={toggleShowPinnedOnOverlay}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
