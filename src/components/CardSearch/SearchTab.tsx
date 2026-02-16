import React from 'react';
import type { Card } from '../../hooks/useCardSearch';
import { CardGrid } from './CardGrid';

interface SearchTabProps {
    // Input Cards
    filteredCards: Card[];
    pinnedCards: Card[];
    onTogglePin: (card: Card) => void;
    onSelect: (card: Card) => void;
    selectedId?: string;
}

export interface SearchTabHandle {
    scrollToTop: () => void;
    scrollToBottom: () => void;
}

export const SearchTab = React.forwardRef<SearchTabHandle, SearchTabProps>(({
    filteredCards,
    pinnedCards,
    onTogglePin,
    onSelect,
    selectedId
}, ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => ({
        scrollToTop: () => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },
        scrollToBottom: () => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }
        }
    }));

    return (
        // Single scrollable frame using h-full to guarantee scroll behavior
        <div
            ref={scrollRef}
            className="w-full h-full overflow-y-auto bg-gray-900 p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        >
            <CardGrid
                cards={filteredCards}
                pinnedCards={pinnedCards}
                onPin={onTogglePin}
                onSelect={onSelect}
                selectedId={selectedId}
                compact={false}
            />
        </div>
    );
});

SearchTab.displayName = 'SearchTab';
