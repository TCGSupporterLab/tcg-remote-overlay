import React from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { CardSearchContainer } from './CardSearch/CardSearchContainer';
import { OverlayDisplay } from './OverlayDisplay';
import { useCardSearch } from '../hooks/useCardSearch';

interface HololiveToolsProps {
    isOverlay?: boolean;
    diceValue?: number;
    coinValue?: string;
    diceKey?: number;
    coinKey?: number;
    onDiceClick?: () => void;
    onCoinClick?: () => void;
    obsMode?: 'normal' | 'transparent' | 'green';
}

export const HololiveTools: React.FC<HololiveToolsProps> = ({
    isOverlay = false,
    diceValue = 1,
    coinValue = '表',
    diceKey = 0,
    coinKey = 0,
    onDiceClick,
    onCoinClick,
    obsMode = 'normal'
}) => {
    const { overlayCard, overlayMode } = useCardSearch();

    // Overlay View: Only show result and image
    if (isOverlay) {
        const isOverlayEnabled = overlayMode !== 'off';
        const isRotated = overlayMode === 'rotated';

        // Background should be transparent when in obs modes to let the body background show through
        const cardFrameBg = obsMode === 'normal' ? '#111827' : 'transparent';
        const cardFrameBorder = obsMode === 'normal' ? 'rgba(255, 255, 255, 0.1)' : 'transparent';

        return (
            <div
                className="fixed inset-0 z-50 flex flex-col items-center justify-center"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent'
                }}
            >
                {/* Main Content Row: Overlaying components for OBS efficiency */}
                <div className="relative flex flex-col items-center justify-center w-fit mx-auto pointer-events-auto">

                    {/* Card Display Area: Fixed height frame */}
                    {isOverlayEnabled && (
                        <div className="relative flex flex-col items-center justify-start rounded-2xl animate-in zoom-in duration-500 transform overflow-hidden"
                            style={{
                                minWidth: '350px',
                                minHeight: '520px',
                                backgroundColor: cardFrameBg,
                                border: `1px solid ${cardFrameBorder}`,
                                boxShadow: obsMode === 'normal' ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : 'none'
                            }}>

                            {/* 1. Dice/Coin Overlay: Flexible Layer that stacks over the frame */}
                            <div className="absolute inset-0 z-30 flex flex-col items-center pointer-events-none p-1">
                                <div className={`flex flex-col items-center w-full h-full transition-all duration-500 ${isRotated ? 'justify-end pb-1' : 'justify-start pt-1'}`}>
                                    <div className="pointer-events-auto shadow-2xl rounded-xl bg-black/20 backdrop-blur-sm p-1">
                                        <OverlayDisplay
                                            diceValue={diceValue}
                                            coinValue={coinValue}
                                            diceKey={diceKey}
                                            coinKey={coinKey}
                                            onDiceClick={onDiceClick}
                                            onCoinClick={onCoinClick}
                                            compact={false} // Use standard size for better visibility on card
                                            showCoin={false}
                                            className="pointer-events-auto scale-80"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 2. Card/Placeholder Area: Fills the remaining space and centers the content */}
                            <div className="flex-1 w-full flex items-center justify-center p-4">
                                {overlayCard ? (
                                    <img
                                        src={overlayCard.resolvedImageUrl || overlayCard.imageUrl}
                                        alt={overlayCard.name}
                                        className={`h-[480px] w-auto object-contain drop-shadow-2xl animate-in fade-in zoom-in duration-300 transition-transform ${isRotated ? 'rotate-180' : ''}`}
                                    />
                                ) : (
                                    <div className={`flex flex-col items-center justify-center text-white/40 gap-4 animate-pulse transition-transform ${isRotated ? 'rotate-180' : ''}`}>
                                        <Search size={64} strokeWidth={1} />
                                        <p className="text-xl font-bold tracking-widest font-orbitron">CARD SELECTING...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* When Overlay is disabled, just show dice/coin centered below */}
                    {!isOverlayEnabled && (
                        <div className="mt-8">
                            <OverlayDisplay
                                diceValue={diceValue}
                                coinValue={coinValue}
                                diceKey={diceKey}
                                coinKey={coinKey}
                                onDiceClick={onDiceClick}
                                onCoinClick={onCoinClick}
                                compact={false}
                                showCoin={false}
                                className="pointer-events-auto"
                            />
                        </div>
                    )}
                </div>
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
                <CardSearchContainer />
            </div>
        </div>
    );
};
