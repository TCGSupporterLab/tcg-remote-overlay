import React from 'react';
import type { Card } from '../../hooks/useCardSearch';
import { PinBadge } from './PinBadge';

interface CardGridProps {
    cards: Card[];
    pinnedCards: Card[];
    onPin: (card: Card) => void;
    onSelect: (card: Card) => void;
    compact?: boolean;
    selectedId?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({ cards, onPin, pinnedCards, onSelect, compact = false, selectedId }) => {
    if (cards.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                表示するカードがありません
            </div>
        );
    }

    const displayLimit = compact ? 300 : 200;
    const visibleCards = cards.slice(0, displayLimit);

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 pb-20 min-h-[50vh]">
            {visibleCards.map((card, index) => {
                const isPinned = pinnedCards.some(c => c.id === card.id);
                const isSelected = selectedId === card.id;

                return (
                    <div
                        key={`${card.id}-${index}`}
                        className="relative card-hover-group flex flex-col items-center"
                        onClick={() => onSelect(card)}
                    >
                        <div
                            className={`relative rounded-lg overflow-hidden cursor-pointer transition-transform duration-75 active:scale-95 border-2 w-full
                                ${isSelected
                                    ? 'border-blue-500 ring-2 ring-blue-500/50'
                                    : 'border-transparent hover:border-gray-500'
                                }
                            `}
                        >
                            <img
                                src={`${import.meta.env.BASE_URL}${card.imageUrl.startsWith('/') ? card.imageUrl.slice(1) : card.imageUrl}`}
                                alt={card.name}
                                className="w-full h-auto object-contain bg-gray-800/50 aspect-[7/10]"
                                onError={(e) => {
                                    const target = e.currentTarget;
                                    if (card.originalImageUrl && target.src !== card.originalImageUrl) {
                                        target.src = card.originalImageUrl;
                                    }
                                }}
                            />

                            {/* Hover Pin Badge */}
                            <PinBadge
                                isPinned={isPinned}
                                onToggle={() => onPin(card)}
                            />
                        </div>
                    </div>
                );
            })}

            {cards.length > (compact ? 300 : 200) && (
                <div className="col-span-full text-center text-gray-500 py-4 text-xs">
                    他 {cards.length - (compact ? 300 : 200)} 件...
                </div>
            )}
        </div>
    );
};
