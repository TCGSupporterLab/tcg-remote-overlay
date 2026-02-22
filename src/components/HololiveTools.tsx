import React from 'react';
import { RotateCcw } from 'lucide-react';
import { CardSearchContainer } from './CardSearch/CardSearchContainer';
import { OverlayDisplay } from './OverlayDisplay';
import { useCardSearch } from '../hooks/useCardSearch';
import type { LocalCard } from '../hooks/useLocalCards';

interface HololiveToolsProps {
    isOverlay?: boolean;
    diceValue?: number;
    coinValue?: string;
    diceKey?: number;
    coinKey?: number;
    onDiceClick?: () => void;
    onCoinClick?: () => void;
    obsMode?: 'normal' | 'green';
    localCards?: LocalCard[];
    metadataOrder?: Record<string, Record<string, string[]>>;
    mergeSameFileCards?: boolean;
    // Widget Visibility & Settings
    isDiceVisible?: boolean;
    isCoinVisible?: boolean;
}

export const HololiveTools: React.FC<HololiveToolsProps> = ({
    isOverlay = false,
    diceValue = 1,
    coinValue = '表',
    diceKey = 0,
    coinKey = 0,
    onDiceClick,
    onCoinClick,
    localCards = [],
    metadataOrder = {},
    mergeSameFileCards = false,
    isDiceVisible = true,
    isCoinVisible = false // Default false for Hololive as it's not commonly used?
}) => {
    const {
        overlayMode,
        pinnedCards,
        setOverlayForcedCard
    } = useCardSearch();

    const inputBufferRef = React.useRef("");
    const timerRef = React.useRef<number | null>(null);

    // Keyboard Shortcuts (Hololive Overlay Pin Select)
    // Only enabled in the separate overlay window (multi-digit support up to 1000)
    React.useEffect(() => {
        const isOverlayWindow = new URLSearchParams(window.location.search).get('view') === 'overlay';
        if (!isOverlayWindow) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (overlayMode === 'off') return;

            const digitMatch = e.code.match(/^(?:Digit|Numpad)(\d)$/);
            if (!digitMatch) return;

            const digit = digitMatch[1];

            if (timerRef.current) window.clearTimeout(timerRef.current);
            inputBufferRef.current += digit;

            timerRef.current = window.setTimeout(() => {
                const num = parseInt(inputBufferRef.current);
                if (num === 0) {
                    setOverlayForcedCard(null);
                } else {
                    const index = num - 1;
                    if (pinnedCards[index]) {
                        setOverlayForcedCard(pinnedCards[index]);
                    }
                }
                inputBufferRef.current = "";
                timerRef.current = null;
            }, 200); // 200ms buffer for multi-digit input
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [pinnedCards, setOverlayForcedCard, overlayMode]);

    // Overlay View: Only show dice and coin
    if (isOverlay) {
        if (!isDiceVisible && !isCoinVisible) return null;

        return (
            <div className="relative w-fit h-fit min-w-[300px] pointer-events-auto flex flex-col items-center">
                <OverlayDisplay
                    diceValue={diceValue}
                    coinValue={coinValue}
                    diceKey={diceKey}
                    coinKey={coinKey}
                    onDiceClick={onDiceClick}
                    onCoinClick={onCoinClick}
                    compact={false}
                    showDice={isDiceVisible}
                    showCoin={isCoinVisible}
                    className="pointer-events-auto"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Part 1: Dice/Coin Controller (Top, Fixed Height) */}
            <div className="flex-none flex flex-row items-center justify-center gap-4 w-full max-w-5xl mx-auto py-4 px-4 z-20">

                {/* Dummy Left Card (Exact Copy of Yugioh P1) - Invisible */}
                <div
                    className="card flex flex-col items-center justify-center transition-colors relative p-2 flex-1 min-w-0 max-w-md invisible"
                    style={{
                        border: '4px solid rgba(255, 255, 255, 0.2)',
                        padding: '1.5rem',
                        opacity: 0,
                        pointerEvents: 'none'
                    }}
                >
                    <button
                        className="p-1 rounded-full text-gray-400"
                        style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 30 }}
                        tabIndex={-1}
                    >
                        <RotateCcw size={16} />
                    </button>

                    <div className="w-full flex justify-center items-center mb-1">
                        <div className="text-sm opacity-80 uppercase tracking-widest font-bold flex items-center gap-2 text-red-300 font-orbitron" style={{ paddingLeft: '8px' }}>
                            Player 1
                        </div>
                    </div>

                    <div className="relative w-full text-center">
                        <div className="text-4xl font-bold font-mono tracking-tighter my-1 text-red-400 transition-all">
                            8000
                        </div>
                    </div>
                </div>

                <OverlayDisplay
                    diceValue={diceValue}
                    coinValue={coinValue}
                    diceKey={diceKey}
                    coinKey={coinKey}
                    onDiceClick={onDiceClick}
                    onCoinClick={onCoinClick}
                    compact={!isOverlay}
                    showCoin={false}
                    className="pointer-events-auto shrink-0 flex-none"
                />

                {/* Dummy Right Card (Exact Copy of Yugioh P2) - Invisible */}
                <div
                    className="card flex flex-col items-center justify-center transition-colors relative p-2 flex-1 min-w-0 max-w-md invisible"
                    style={{
                        border: '4px solid rgba(255, 255, 255, 0.2)',
                        padding: '1.5rem',
                        opacity: 0,
                        pointerEvents: 'none'
                    }}
                >
                    <button
                        className="p-1 rounded-full text-gray-400"
                        style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 30 }}
                        tabIndex={-1}
                    >
                        <RotateCcw size={16} />
                    </button>

                    <div className="w-full flex justify-center items-center mb-1">
                        <div className="text-sm opacity-80 uppercase tracking-widest font-bold flex items-center gap-2 text-blue-300 font-orbitron" style={{ paddingLeft: '8px' }}>
                            Player 2
                        </div>
                    </div>

                    <div className="relative w-full text-center">
                        <div className="text-4xl font-bold font-mono tracking-tighter my-1 text-blue-400 transition-all">
                            8000
                        </div>
                    </div>
                </div>
            </div>

            {/* Part 2: Card Search Tool (Bottom, Fills remaining space) */}
            <div className="flex-1 overflow-hidden min-h-0 bg-gray-900 border-t border-gray-700">
                <CardSearchContainer localCards={localCards} metadataOrder={metadataOrder} mergeSameFileCards={mergeSameFileCards} />
            </div>
        </div>
    );
};
