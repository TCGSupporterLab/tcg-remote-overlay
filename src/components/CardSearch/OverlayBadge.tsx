import React from 'react';
import { Monitor } from 'lucide-react';

interface OverlayBadgeProps {
    isActive: boolean;
    onToggle: (e: React.MouseEvent) => void;
}

export const OverlayBadge: React.FC<OverlayBadgeProps> = ({ isActive, onToggle }) => {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onToggle(e);
            }}
            className={`absolute overlay-badge p-1.5 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200
                ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-black/60 text-white hover:bg-blue-600'
                }
            `}
            style={{
                top: '6px',
                left: '6px',
                zIndex: 10,
                opacity: isActive ? 1 : undefined
            }}
            title={isActive ? "オーバーレイ表示を解除" : "オーバーレイに表示"}
        >
            <Monitor size={14} fill={isActive ? "currentColor" : "none"} />
        </button>
    );
};
