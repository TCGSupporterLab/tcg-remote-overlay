import React from 'react';

interface DigitalDisplayProps {
    value: number;
    color: 'red' | 'blue';
    className?: string;
    obsMode?: 'normal' | 'transparent' | 'green';
}

export const DigitalDisplay: React.FC<DigitalDisplayProps> = ({ value, color, className }) => {
    // Generate gradient IDs based on color
    const gradientId = `grad-${color}`;
    const glowId = `glow-${color}`;

    // Color definitions
    const colors = color === 'red'
        ? { start: '#fee2e2', end: '#ef4444', glow: '#dc2626' } // Red-50 to Red-500
        : { start: '#e0f2fe', end: '#3b82f6', glow: '#2563eb' }; // Blue-50 to Blue-500

    return (
        <div className={`w-full h-24 flex items-center justify-center ${className || ''}`}>
            <svg viewBox="0 0 300 80" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="white" />
                        <stop offset="20%" stopColor="white" />
                        <stop offset="100%" stopColor={colors.end} />
                    </linearGradient>

                    <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <text
                    x="50%"
                    y="50%"
                    dominantBaseline="central"
                    textAnchor="middle"
                    fontFamily="Impact, Arial Black, sans-serif"
                    fontSize="80"
                    fontWeight="900"
                    letterSpacing="-2"
                    fill={`url(#${gradientId})`}
                    filter={`url(#${glowId})`}
                    stroke={colors.glow}
                    strokeWidth="1"
                    className="drop-shadow-lg"
                    style={{
                        fontVariantNumeric: 'tabular-nums',
                        paintOrder: 'stroke'
                    }}
                >
                    {value}
                </text>
            </svg>
        </div>
    );
};
