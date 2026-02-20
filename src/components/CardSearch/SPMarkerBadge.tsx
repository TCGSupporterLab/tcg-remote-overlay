import React from 'react';

export type SPMarkerMode = 'off' | 'follow' | 'independent';

interface SPMarkerBadgeProps {
    mode: SPMarkerMode;
    onToggle: (e: React.MouseEvent) => void;
}

export const SPMarkerBadge: React.FC<SPMarkerBadgeProps> = ({ mode, onToggle }) => {
    const isActive = mode !== 'off';

    // Cycle through modes: off -> follow -> independent -> off
    const getNextModeLabel = () => {
        if (mode === 'off') return "SPマーカーを表示 (カード追従)";
        if (mode === 'follow') return "SPマーカーを表示 (独立)";
        return "SPマーカーを非表示";
    };

    const getIcon = () => {
        const textStyle = {
            fontSize: '11px',
            fontWeight: '600',
            lineHeight: '1.2',
            fontFamily: 'system-ui, sans-serif'
        };

        if (mode === 'off') {
            return (
                <div className="flex items-center justify-center">
                    <span style={{ ...textStyle, color: '#9ca3af' }}>SP</span>
                </div>
            );
        }

        if (mode === 'follow') {
            return (
                // Larger rectangle by expanding outward (more padding/size)
                <div className="flex items-center justify-center border-[1.5px] border-white w-5 h-4.5 rounded-[3px] box-border">
                    <span style={textStyle}>SP</span>
                </div>
            );
        }

        // independent
        return (
            <div className="flex items-center justify-center w-3.5 h-3.5">
                <span style={textStyle}>SP</span>
            </div>
        );
    };

    const getBgColor = () => {
        if (mode === 'follow') return 'bg-amber-500 text-white';
        if (mode === 'independent') return 'bg-purple-600 text-white';
        return 'bg-black/60 text-white hover:bg-amber-600';
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onToggle(e);
            }}
            className={`absolute sp-marker-badge p-1.5 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center
                ${getBgColor()}
            `}
            style={{
                top: '78px',
                left: '6px',
                width: '30px',
                height: '26px',
                zIndex: 10,
                opacity: isActive ? 1 : undefined
            }}
            title={getNextModeLabel()}
        >
            {getIcon()}
        </button>
    );
};
