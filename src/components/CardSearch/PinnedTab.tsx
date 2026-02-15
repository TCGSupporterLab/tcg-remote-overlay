import React from 'react';
import type { Card } from '../../hooks/useCardSearch';
import { CardGrid } from './CardGrid';
import { Trash2, Monitor } from 'lucide-react';

interface PinnedTabProps {
    pinnedCards: Card[];
    showOnOverlay: boolean;
    onTogglePin: (card: Card) => void;
    onSelect: (card: Card) => void;
    onResetPins: () => void;
    onToggleOverlay: () => void;
}

export const PinnedTab: React.FC<PinnedTabProps> = ({
    pinnedCards,
    showOnOverlay,
    onTogglePin,
    onSelect,
    onResetPins,
    onToggleOverlay
}) => {
    return (
        <div className="flex flex-col h-full w-full bg-gray-900">
            {/* Toolbar */}
            <div className="flex-none bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">

                {/* Overlay Toggle Switch */}
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={showOnOverlay}
                            onChange={onToggleOverlay}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white flex items-center gap-2">
                        <Monitor size={16} />
                        オーバーレイに表示
                    </span>
                </label>

                {/* Reset Button */}
                {pinnedCards.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm('ピン留めをすべて解除しますか？')) {
                                onResetPins();
                            }
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-900/50 hover:bg-red-900 text-red-200 rounded border border-red-800 transition-colors"
                    >
                        <Trash2 size={16} />
                        全て解除 (Reset)
                    </button>
                )}
            </div>

            {/* Pinned Grid - Absolute Scroll Container */}
            <div className="flex-1 relative min-h-0">
                <div className="absolute inset-0 w-full h-full overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-600 bg-gray-900">
                    {pinnedCards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                            <PinIconPlaceholder />
                            <p className="text-lg">まだピン留めされたカードはありません</p>
                            <p className="text-sm text-gray-600">検索タブでカードにマウスを乗せ、ピン留めボタンを押すと追加できます</p>
                        </div>
                    ) : (
                        <CardGrid
                            cards={pinnedCards}
                            pinnedCards={pinnedCards} // All are pinned here
                            onPin={onTogglePin}
                            onSelect={onSelect}
                            compact={false}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

const PinIconPlaceholder = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-20">
        <line x1="12" y1="17" x2="12" y2="22"></line>
        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
    </svg>
);
