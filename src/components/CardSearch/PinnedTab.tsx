import React, { useRef } from 'react';
import type { Card } from '../../hooks/useCardSearch';
import { CardGrid } from './CardGrid';
import { Trash2, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';

interface PinnedTabProps {
    pinnedCards: Card[];
    pinnedIds: Set<string>;
    onTogglePin: (card: Card) => void;
    onSelect: (card: Card) => void;
    onResetPins: () => void;
    selectedId?: string;
    selectedImageUrl?: string;
}

export interface PinnedTabHandle {
    scrollToTop: () => void;
    scrollToBottom: () => void;
}

export const PinnedTab = React.forwardRef<PinnedTabHandle, PinnedTabProps>(({
    pinnedCards,
    pinnedIds,
    onTogglePin,
    onSelect,
    onResetPins,
    selectedId,
    selectedImageUrl
}, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);

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

    const buttonStyle = (isDanger: boolean = false): React.CSSProperties => ({
        padding: '6px 16px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 'bold',
        border: '1px solid',
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        backgroundColor: '#1f2937', // Gray-800
        color: isDanger ? '#fca5a5' : '#9ca3af', // Red-300 : Gray-400
        borderColor: isDanger ? '#991b1b' : '#374151', // Red-800 : Gray-700
    });

    return (
        <div className="flex flex-col h-full w-full bg-gray-900">
            {/* Toolbar */}
            <div className="flex-none bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-end gap-2">
                {/* Reset Button */}
                {pinnedCards.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm('ピン留めをすべて解除しますか？')) {
                                onResetPins();
                            }
                        }}
                        style={buttonStyle(true)}
                        className="hover:bg-red-900/40 hover:text-red-200 transition-colors"
                    >
                        <Trash2 size={14} className="inline mr-1" />
                        全て解除
                    </button>
                )}

                {/* Scroll Buttons */}
                <div className="flex gap-1">
                    <button
                        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{ ...buttonStyle(false), padding: '6px 10px' }}
                        className="hover:border-cyan-500 hover:text-cyan-400 transition-colors"
                        title="一番上へ"
                    >
                        <ArrowUpToLine size={16} />
                    </button>
                    <button
                        onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
                        style={{ ...buttonStyle(false), padding: '6px 10px' }}
                        className="hover:border-cyan-500 hover:text-cyan-400 transition-colors"
                        title="一番下へ"
                    >
                        <ArrowDownToLine size={16} />
                    </button>
                </div>
            </div>

            {/* Pinned Grid */}
            <div className="flex-1 relative min-h-0">
                <div
                    ref={scrollRef}
                    className="absolute inset-0 overflow-y-auto bg-gray-900 p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                >
                    {pinnedCards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                            <PinIconPlaceholder />
                            <p className="text-lg">まだピン留めされたカードはありません</p>
                            <p className="text-sm text-gray-600">検索タブでカードにマウスを乗せ、ピン留めボタンを押すと追加できます</p>
                        </div>
                    ) : (
                        <CardGrid
                            cards={pinnedCards}
                            pinnedIds={pinnedIds}
                            onPin={onTogglePin}
                            onSelect={onSelect}
                            selectedId={selectedId}
                            selectedImageUrl={selectedImageUrl}
                            containerRef={scrollRef}
                        />
                    )}
                </div>
            </div>
        </div>
    );
});

PinnedTab.displayName = 'PinnedTab';

const PinIconPlaceholder = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-20">
        <line x1="12" y1="17" x2="12" y2="22"></line>
        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
    </svg>
);
