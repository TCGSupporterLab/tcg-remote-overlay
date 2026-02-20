import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Card } from '../../hooks/useCardSearch';
import { CardGrid } from './CardGrid';

interface SearchTabProps {
    filteredCards: Card[];
    pinnedUniqueKeys: Set<string>;
    searchKey: string;
    onTogglePin: (card: Card) => void;
    onSelect: (card: Card) => void;
    selectedId?: string;
    selectedImageUrl?: string;
}

export interface SearchTabHandle {
    scrollToTop: () => void;
    scrollToBottom: () => void;
}

const ITEMS_PER_PAGE = 50; // Increased for better fill

export const SearchTab = React.forwardRef<SearchTabHandle, SearchTabProps>(({
    filteredCards,
    pinnedUniqueKeys,
    searchKey,
    onTogglePin,
    onSelect,
    selectedId,
    selectedImageUrl
}, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    // RESET when search changes
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [searchKey]);

    const hasMore = visibleCount < filteredCards.length;

    // Load more function
    const loadMore = useCallback(() => {
        if (!hasMore) return;
        setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredCards.length));
    }, [hasMore, filteredCards.length]);

    // Intersection Observer for infinite scroll
    const observer = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useCallback((node: HTMLDivElement | null) => {
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMore();
            }
        }, {
            root: scrollRef.current,
            rootMargin: '400px', // Detect much earlier
            threshold: 0.01
        });

        if (node) observer.current.observe(node);
    }, [loadMore]);

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

    const visibleCards = filteredCards.slice(0, visibleCount);

    return (
        <div
            key={searchKey}
            ref={scrollRef}
            className="absolute inset-0 overflow-y-auto bg-gray-900 p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        >
            <CardGrid
                cards={visibleCards}
                pinnedUniqueKeys={pinnedUniqueKeys}
                onPin={onTogglePin}
                onSelect={onSelect}
                selectedId={selectedId}
                selectedImageUrl={selectedImageUrl}
            />

            {/* sentinel component with robust observing */}
            {hasMore && (
                <div
                    ref={sentinelRef}
                    className="h-32 w-full flex flex-col items-center justify-center text-gray-500 gap-2 cursor-pointer hover:text-cyan-400"
                    onClick={loadMore} // Prevent getting stuck
                >
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-500 border-t-transparent"></div>
                    <span>さらに読み込み中... ({filteredCards.length - visibleCount}枚残り)</span>
                    <span className="text-[10px] opacity-50">反応がない場合はここをクリック</span>
                </div>
            )}
            <div className="h-20 w-full" />
        </div>
    );
});

SearchTab.displayName = 'SearchTab';
