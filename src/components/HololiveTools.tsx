import React from 'react';
import { RotateCcw } from 'lucide-react';
import { CardSearchContainer } from './CardSearch/CardSearchContainer';
import { OverlayDisplay } from './OverlayDisplay';

interface HololiveToolsProps {
    isOverlay?: boolean;
    diceValue?: number;
    coinValue?: string;
    diceKey?: number;
    coinKey?: number;
    onDiceClick?: () => void;
    onCoinClick?: () => void;
}

export const HololiveTools: React.FC<HololiveToolsProps> = ({
    isOverlay = false,
    diceValue = 1,
    coinValue = '表',
    diceKey = 0,
    coinKey = 0,
    onDiceClick,
    onCoinClick
}) => {
    // Overlay View: Only show result and image
    if (isOverlay) {
        return (
            <div
                className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-transparent pointer-events-none"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    pointerEvents: 'none'
                }}
            >
                {/* Main Content Row */}
                <div className="flex flex-row items-center justify-center gap-16 w-full pointer-events-auto">
                    <OverlayDisplay
                        diceValue={diceValue}
                        coinValue={coinValue}
                        diceKey={diceKey}
                        coinKey={coinKey}
                        onDiceClick={onDiceClick}
                        onCoinClick={onCoinClick}
                        className="pointer-events-auto"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Part 1: Dice/Coin Controller (Top, Fixed Height) */}
            {/* Part 1: Dice/Coin Controller (Top, Fixed Height) - Matching YugiohTools Layout */}
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
                <CardSearchContainer />
            </div>
        </div>
    );
};
