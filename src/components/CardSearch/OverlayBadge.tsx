import React from 'react';
import { Monitor } from 'lucide-react';

interface OverlayBadgeProps {
    mode: 'off' | 'on' | 'rotated';
    onToggle: (e: React.MouseEvent) => void;
}

export const OverlayBadge: React.FC<OverlayBadgeProps> = ({ mode, onToggle }) => {
    const isActive = mode !== 'off';
    const isRotated = mode === 'rotated';

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onToggle(e);
            }}
            className={`absolute overlay-badge p-1.5 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200
                ${mode === 'on' ? 'bg-blue-600 text-white' :
                    mode === 'rotated' ? 'bg-purple-600 text-white' :
                        'bg-black/60 text-white hover:bg-blue-600'}
            `}
            style={{
                top: '6px',
                left: '6px',
                zIndex: 10,
                opacity: isActive ? 1 : undefined
            }}
            title={
                mode === 'off' ? "オーバーレイに表示" :
                    mode === 'on' ? "180度回転して表示" :
                        "オーバーレイ表示を解除"
            }
        >
            <Monitor size={14} fill={isActive ? "currentColor" : "none"} className={isRotated ? "rotate-180" : ""} />
        </button>
    );
};
