import React, { useEffect, useRef } from 'react';
import type { Card } from '../../hooks/useCardSearch';
import { PinBadge } from './PinBadge';
import { Folder } from 'lucide-react';

interface CardGridProps {
    cards: Card[];
    pinnedUniqueKeys: Set<string>;
    onPin: (card: Card) => void;
    onSelect: (card: Card) => void;
    onReorder?: (startIndex: number, endIndex: number) => void;
    selectedId?: string;
    selectedImageUrl?: string;
    showIndex?: boolean;
}

// Memory-efficient card item
const CardItem = React.memo(({
    card,
    isPinned,
    isSelected,
    onPin,
    onSelect,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    isDragging,
    indexLabel
}: {
    card: Card,
    isPinned: boolean,
    isSelected: boolean,
    onPin: (card: Card) => void,
    onSelect: (card: Card) => void,
    onDragStart?: (e: React.DragEvent) => void,
    onDragOver?: (e: React.DragEvent) => void,
    onDrop?: (e: React.DragEvent) => void,
    onDragEnd?: (e: React.DragEvent) => void,
    isDragging?: boolean,
    indexLabel?: string
}) => {
    return (
        <div
            className={`relative flex flex-col items-center transition-opacity ${isDragging ? 'opacity-30' : 'opacity-100'}`}
        >
            <div
                className={`card-hover-group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-75 active:scale-95 border-2 aspect-[7/10] bg-gray-800/30 w-[150px]
                    ${isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'border-transparent hover:border-gray-500'
                    }
                `}
                onClick={() => onSelect(card)}
                onDoubleClick={() => onPin(card)}
                draggable={!!onDragStart}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
            >
                {indexLabel && (
                    <div
                        className="absolute z-20 flex items-center justify-center font-bold text-white shadow-lg backdrop-blur-md px-1.5"
                        style={{
                            top: '6px',
                            left: '6px',
                            height: '24px',
                            minWidth: '24px',
                            fontSize: indexLabel.length >= 3 ? '9px' : '11px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
                        }}
                    >
                        {indexLabel}
                    </div>
                )}

                {card.isFolder ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/80 text-cyan-400 gap-4">
                        <div className="p-4 rounded-full bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-500/20">
                            <Folder size={64} strokeWidth={1.2} />
                        </div>
                        <span className="text-[14px] font-bold px-4 text-center leading-snug break-words opacity-95 tracking-wide">{card.name}</span>
                    </div>
                ) : (
                    <img
                        src={card.resolvedImageUrl || card.imageUrl}
                        alt={card.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-opacity duration-300"
                        onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                        style={{ opacity: 0 }}
                    />
                )}

                <PinBadge
                    isPinned={isPinned}
                    onToggle={() => onPin(card)}
                />
            </div>
        </div>
    );
});

CardItem.displayName = 'CardItem';

export const CardGrid: React.FC<CardGridProps> = ({
    cards,
    onPin,
    pinnedUniqueKeys,
    onSelect,
    onReorder,
    selectedId,
    selectedImageUrl,
    showIndex
}) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (cards.length === 0) return;

            // Ignore if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const currentIndex = cards.findIndex(c => c.id === selectedId);
            let nextIndex = -1;

            // Get number of columns by measuring grid layout
            const gridEl = gridRef.current;
            if (!gridEl) return;
            const columns = window.getComputedStyle(gridEl).gridTemplateColumns.split(' ').length;

            switch (e.key) {
                case 'ArrowLeft':
                    nextIndex = currentIndex === -1 ? 0 : Math.max(0, currentIndex - 1);
                    break;
                case 'ArrowRight':
                    nextIndex = currentIndex === -1 ? 0 : Math.min(cards.length - 1, currentIndex + 1);
                    break;
                case 'ArrowUp':
                    nextIndex = currentIndex === -1 ? 0 : Math.max(0, currentIndex - columns);
                    break;
                case 'ArrowDown':
                    nextIndex = currentIndex === -1 ? 0 : Math.min(cards.length - 1, currentIndex + columns);
                    break;
                default:
                    return;
            }

            if (nextIndex !== -1 && nextIndex !== currentIndex) {
                e.preventDefault();
                onSelect(cards[nextIndex]);

                // Ensure the selected card is in view
                setTimeout(() => {
                    const nextEl = gridEl.children[nextIndex] as HTMLElement;
                    if (nextEl) {
                        nextEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 0);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cards, selectedId, onSelect]);

    if (cards.length === 0) {
        return (
            <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-2">
                <div className="text-4xl opacity-20">📭</div>
                <p>表示するカードがありません</p>
            </div>
        );
    }

    return (
        <div
            ref={gridRef}
            className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 pb-24 min-h-[50vh]"
        >
            {cards.map((card, idx) => (
                <CardItem
                    key={`${card.id}-${card.imageUrl}`}
                    card={card}
                    isPinned={pinnedUniqueKeys.has(`${card.id}-${card.imageUrl}`)}
                    isSelected={selectedId === card.id && (selectedImageUrl ? card.imageUrl === selectedImageUrl : true)}
                    onPin={onPin}
                    onSelect={onSelect}
                    isDragging={draggingIndex === idx}
                    onDragStart={onReorder ? (e) => {
                        setDraggingIndex(idx);
                        e.dataTransfer.effectAllowed = 'move';
                    } : undefined}
                    onDragOver={onReorder ? (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                    } : undefined}
                    onDrop={onReorder ? (e) => {
                        e.preventDefault();
                        if (draggingIndex !== null && draggingIndex !== idx) {
                            onReorder(draggingIndex, idx);
                        }
                    } : undefined}
                    onDragEnd={onReorder ? () => {
                        setDraggingIndex(null);
                    } : undefined}
                    indexLabel={showIndex ? (idx + 1).toString() : undefined}
                />
            ))}
        </div>
    );
};
