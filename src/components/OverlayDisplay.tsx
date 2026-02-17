import React, { useEffect, useState } from 'react';
import { ThreeDDice } from './ThreeDDice';
import { ThreeDCoin } from './ThreeDCoin';

interface OverlayDisplayProps {
    diceValue: number;
    coinValue: string;
    diceKey: number;
    coinKey: number;
    onDiceClick?: () => void;
    onCoinClick?: () => void;
    className?: string;
    compact?: boolean;
    showCoin?: boolean;
}

export const OverlayDisplay: React.FC<OverlayDisplayProps> = ({
    diceValue, coinValue, diceKey, coinKey,
    onDiceClick, onCoinClick, className, compact = false,
    showCoin = true
}) => {
    const [isDiceRolling, setIsDiceRolling] = useState(false);
    const [isCoinFlipping, setIsCoinFlipping] = useState(false);

    // Track last animated key to prevent animation on mount
    const lastAnimatedDiceKey = React.useRef(diceKey);
    const lastAnimatedCoinKey = React.useRef(coinKey);

    // Dice Animation trigger
    useEffect(() => {
        if (diceKey !== lastAnimatedDiceKey.current && diceKey > 0) {
            setIsDiceRolling(true);
            const timer = setTimeout(() => setIsDiceRolling(false), 450);
            lastAnimatedDiceKey.current = diceKey;
            return () => clearTimeout(timer);
        }
    }, [diceKey]);

    // Coin Animation trigger
    useEffect(() => {
        if (coinKey !== lastAnimatedCoinKey.current && coinKey > 0) {
            setIsCoinFlipping(true);
            const timer = setTimeout(() => setIsCoinFlipping(false), 450);
            lastAnimatedCoinKey.current = coinKey;
            return () => clearTimeout(timer);
        }
    }, [coinKey]);

    const containerClass = compact
        ? "flex items-center gap-2 pointer-events-none z-50 py-1" // Compact Gap (Tightened)
        : "flex items-center gap-4 pointer-events-none z-50"; // Overlay Gap (Even smaller)

    const itemWrapperClass = compact
        ? "flex flex-col items-center gap-1 pointer-events-auto cursor-pointer hover:bg-white/5 rounded-lg p-1 hover:scale-105 active:scale-95"
        : "flex flex-col items-center gap-1 pointer-events-auto cursor-pointer hover:bg-white/5 rounded-xl p-1 hover:scale-105 active:scale-95";

    const itemSizeClass = compact
        ? "relative h-12 w-12 flex items-center justify-center scale-75" // Compact Size (Smaller)
        : "relative h-20 w-20 flex items-center justify-center scale-100"; // Overlay Size (Even smaller)

    return (
        <div className={`${containerClass} ${className || ''}`}>

            {/* Dice Section */}
            <div
                className={itemWrapperClass}
                onClick={onDiceClick}
                title="クリックしてサイコロを振る"
            >
                <div className={itemSizeClass}>
                    <ThreeDDice
                        value={diceValue}
                        rolling={isDiceRolling}
                    />
                </div>
            </div>

            {/* Coin Section */}
            {showCoin && (
                <div
                    className={`${itemWrapperClass} ${!compact ? 'translate-x-8' : ''}`}
                    onClick={onCoinClick}
                    title="クリックしてコイントス"
                >
                    <div className={itemSizeClass}>
                        <ThreeDCoin
                            value={coinValue === '表' || coinValue === 'Heads' ? '表' : '裏'}
                            flipping={isCoinFlipping}
                        />
                    </div>
                </div>
            )}

        </div>
    );
};
