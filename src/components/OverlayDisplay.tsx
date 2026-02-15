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
}

export const OverlayDisplay: React.FC<OverlayDisplayProps> = ({
    diceValue, coinValue, diceKey, coinKey,
    onDiceClick, onCoinClick, className, compact = false
}) => {
    const [isDiceRolling, setIsDiceRolling] = useState(false);
    const [isCoinFlipping, setIsCoinFlipping] = useState(false);

    // Dice Animation trigger
    useEffect(() => {
        if (diceKey > 0) {
            setIsDiceRolling(true);
            const timer = setTimeout(() => setIsDiceRolling(false), 450);
            return () => clearTimeout(timer);
        }
    }, [diceKey]);

    // Coin Animation trigger
    useEffect(() => {
        if (coinKey > 0) {
            setIsCoinFlipping(true);
            const timer = setTimeout(() => setIsCoinFlipping(false), 450); // Coin animation is now faster to match dice
            return () => clearTimeout(timer);
        }
    }, [coinKey]);

    const containerClass = compact
        ? "flex items-center gap-4 pointer-events-none z-50 py-2" // Compact Gap
        : "flex items-center gap-32 pointer-events-none z-50"; // Overlay Gap

    const itemWrapperClass = compact
        ? "flex flex-col items-center gap-1 pointer-events-auto cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-all hover:scale-105 active:scale-95"
        : "flex flex-col items-center gap-4 pointer-events-auto cursor-pointer hover:bg-white/5 rounded-xl p-4 transition-all hover:scale-105 active:scale-95";

    const itemSizeClass = compact
        ? "relative h-16 w-16 flex items-center justify-center scale-90" // Compact Size
        : "relative h-32 w-32 flex items-center justify-center scale-125"; // Overlay Size

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
            <div
                className={itemWrapperClass}
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

        </div>
    );
};
