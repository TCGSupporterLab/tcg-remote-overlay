import React from 'react';
import { Image, Type } from 'lucide-react';

interface DisplayModeBadgeProps {
    mode: 'image' | 'text';
    onToggle: (e: React.MouseEvent) => void;
}

export const DisplayModeBadge: React.FC<DisplayModeBadgeProps> = ({ mode, onToggle }) => {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onToggle(e);
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            className={`absolute display-mode-badge p-1.5 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200
                ${mode === 'text' ? 'bg-indigo-600 text-white' : 'bg-black/60 text-white hover:bg-indigo-600'}
            `}
            style={{
                top: '42px',
                left: '6px', // Positioned below OverlayBadge
                zIndex: 10,
            }}
            title={
                mode === 'image' ? "画像表示中 (クリックでテキストに切替)" : "テキスト表示中 (クリックで画像に切替)"
            }
        >
            {mode === 'image' ? <Image size={14} /> : <Type size={14} />}
        </button>
    );
};
