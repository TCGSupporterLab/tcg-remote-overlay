import React from 'react';
import { Monitor } from 'lucide-react';

interface OverlayBadgeProps {
    mode: 'off' | 'on';
    onToggle: (e: React.MouseEvent) => void;
}

export const OverlayBadge: React.FC<OverlayBadgeProps> = ({ mode, onToggle }) => {
    const isActive = mode !== 'off';

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onToggle(e);
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            className={`absolute overlay-badge p-1.5 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200
                ${mode === 'on' ? 'bg-blue-600 text-white' : 'bg-black/60 text-white hover:bg-blue-600'}
            `}
            style={{
                top: '6px',
                left: '6px',
                zIndex: 10,
                opacity: isActive ? 1 : undefined
            }}
            title={
                mode === 'off' ? "オーバーレイに表示" : "オーバーレイ表示を解除"
            }
        >
            <Monitor size={14} fill={isActive ? "currentColor" : "none"} />
        </button>
    );
};
