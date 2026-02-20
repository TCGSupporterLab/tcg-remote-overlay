import React from 'react';
import { Pin } from 'lucide-react';

interface PinBadgeProps {
    isPinned: boolean;
    onToggle: (e: React.MouseEvent) => void;
}

export const PinBadge: React.FC<PinBadgeProps> = ({ isPinned, onToggle }) => {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onToggle(e);
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            className={`absolute pin-badge p-1.5 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200
                ${isPinned
                    ? 'bg-yellow-500 text-white'
                    : 'bg-black/60 text-white hover:bg-blue-600'
                }
            `}
            style={{
                top: '6px',
                right: '6px',
                zIndex: 10,
                opacity: isPinned ? 1 : undefined
            }}
            title={isPinned ? "ピン留めを解除" : "ピン留めする"}
        >
            <Pin size={14} fill={isPinned ? "currentColor" : "none"} />
        </button>
    );
};
