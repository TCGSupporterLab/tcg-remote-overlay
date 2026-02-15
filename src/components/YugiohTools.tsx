import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Undo2, Redo2 } from 'lucide-react';

import { OverlayDisplay } from './OverlayDisplay';
import { DigitalDisplay } from './DigitalDisplay';

interface PlayerState {
    life: number;
    log: number[];
    isRotated?: boolean;
}

const INITIAL_LIFE = 8000;
const CHANNEL_NAME = 'remote_duel_sync_yugioh';

interface YugiohToolsProps {
    isOverlay?: boolean;
    diceValue?: number;
    coinValue?: string;
    diceKey?: number;
    coinKey?: number;
    onDiceClick?: () => void;
    onCoinClick?: () => void;
}

export const YugiohTools: React.FC<YugiohToolsProps> = ({
    isOverlay = false,
    diceValue = 1, coinValue = '表', diceKey = 0, coinKey = 0,
    onDiceClick, onCoinClick
}) => {
    const [p1, setP1] = useState<PlayerState>({ life: INITIAL_LIFE, log: [INITIAL_LIFE], isRotated: false });
    const [p2, setP2] = useState<PlayerState>({ life: INITIAL_LIFE, log: [INITIAL_LIFE], isRotated: false });
    const [inputValue, setInputValue] = useState<string>('');
    const [targetPlayer, setTargetPlayer] = useState<'p1' | 'p2' | null>('p1');

    const [history, setHistory] = useState<{ p1: PlayerState, p2: PlayerState }[]>([
        { p1: { life: INITIAL_LIFE, log: [INITIAL_LIFE], isRotated: false }, p2: { life: INITIAL_LIFE, log: [INITIAL_LIFE], isRotated: false } }
    ]);
    const [currentStep, setCurrentStep] = useState(0);

    // Sync Logic
    useEffect(() => {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = (event) => {
            const data = event.data;
            if (data.p1) setP1(data.p1);
            if (data.p2) setP2(data.p2);
        };
        return () => channel.close();
    }, []);

    const broadcastUpdate = (newP1: PlayerState, newP2: PlayerState) => {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({ p1: newP1, p2: newP2 });
        channel.close();
    };

    const updateState = (newP1: PlayerState, newP2: PlayerState) => {
        // Update History
        const newHistory = history.slice(0, currentStep + 1);
        newHistory.push({ p1: newP1, p2: newP2 });
        setHistory(newHistory);
        setCurrentStep(newHistory.length - 1);

        // Update State
        setP1(newP1);
        setP2(newP2);
        broadcastUpdate(newP1, newP2);
    };

    const updateLife = (player: 'p1' | 'p2', newLife: number) => {
        const clampedLife = Math.max(0, Math.min(99999, newLife));

        // Prevent redundant history entries if life didn't change
        const currentLife = player === 'p1' ? p1.life : p2.life;
        if (clampedLife === currentLife) return;

        let newP1 = p1;
        let newP2 = p2;

        if (player === 'p1') {
            newP1 = { ...p1, life: clampedLife, log: [clampedLife, ...p1.log].slice(0, 10) };
        } else {
            newP2 = { ...p2, life: clampedLife, log: [clampedLife, ...p2.log].slice(0, 10) };
        }
        updateState(newP1, newP2);
    };

    const toggleRotation = (player: 'p1' | 'p2') => {
        let newP1 = p1;
        let newP2 = p2;

        if (player === 'p1') {
            newP1 = { ...p1, isRotated: !p1.isRotated };
        } else {
            newP2 = { ...p2, isRotated: !p2.isRotated };
        }

        // Update State without pushing to history
        setP1(newP1);
        setP2(newP2);
        broadcastUpdate(newP1, newP2);
    };

    const handleUndo = () => {
        if (currentStep > 0) {
            const prevStep = currentStep - 1;
            const prevState = history[prevStep];

            // Restore life/log but keep current rotation
            const restoredP1: PlayerState = { ...prevState.p1, isRotated: p1.isRotated };
            const restoredP2: PlayerState = { ...prevState.p2, isRotated: p2.isRotated };

            setP1(restoredP1);
            setP2(restoredP2);
            setCurrentStep(prevStep);
            broadcastUpdate(restoredP1, restoredP2);
        }
    };

    const handleRedo = () => {
        if (currentStep < history.length - 1) {
            const nextStep = currentStep + 1;
            const nextState = history[nextStep];

            // Restore life/log but keep current rotation
            const restoredP1: PlayerState = { ...nextState.p1, isRotated: p1.isRotated };
            const restoredP2: PlayerState = { ...nextState.p2, isRotated: p2.isRotated };

            setP1(restoredP1);
            setP2(restoredP2);
            setCurrentStep(nextStep);
            broadcastUpdate(restoredP1, restoredP2);
        }
    };

    // Calculator Handlers
    const handleNumClick = (val: number | string) => {
        const strVal = val.toString();
        // Prevent 0, 00, 000 if input is empty or 0
        if ((inputValue === '' || inputValue === '0') && (strVal === '0' || strVal === '00' || strVal === '000')) {
            return;
        }

        setInputValue(prev => {
            if (prev === '0') return strVal;
            return prev + strVal;
        });
    };

    const handleClear = () => {
        setInputValue('');
    };

    const handleOperation = (op: '+' | '-') => {
        if (!targetPlayer || !inputValue) return;
        const value = parseInt(inputValue, 10);
        if (isNaN(value)) return;

        const currentLife = targetPlayer === 'p1' ? p1.life : p2.life;
        let newLife = currentLife;

        if (op === '+') {
            newLife += value;
        } else {
            newLife -= value;
        }

        updateLife(targetPlayer, newLife);
        setInputValue('');
    };

    const handleHalf = () => {
        if (!targetPlayer) return;
        const currentLife = targetPlayer === 'p1' ? p1.life : p2.life;
        updateLife(targetPlayer, Math.ceil(currentLife / 2));
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isOverlay) return; // Disable shortcuts in overlay mode
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return; // Ignore if typing in an input

            // Undo / Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                handleUndo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                handleRedo();
                return;
            }

            // Numbers
            if (/^[0-9]$/.test(e.key)) {
                e.preventDefault();
                handleNumClick(parseInt(e.key));
                return;
            }

            // Operations
            if (e.key === '+' || e.key === 'Add') {
                e.preventDefault();
                handleOperation('+');
                return;
            }
            if (e.key === '-' || e.key === 'Subtract' || e.key === 'Enter') { // Enter is treated as -
                e.preventDefault();
                handleOperation('-');
                return;
            }
            if (e.key === '/' || e.key === 'Divide') {
                e.preventDefault();
                handleHalf();
                return;
            }
            if (e.key === 'Delete' || e.key === 'Del') {
                e.preventDefault();
                handleClear();
                return;
            }

            // Target Selection (Arrow Keys)
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setTargetPlayer('p1');
                return;
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                setTargetPlayer('p2');
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOverlay, handleNumClick, handleOperation, handleHalf, handleClear, handleUndo, handleRedo]);

    // Layout constants
    const overlayWrapperClass = "fixed inset-0 z-50 flex flex-col items-center justify-center bg-transparent pointer-events-none";

    // Inner row constants
    const overlayRowClass = "flex flex-row items-center justify-center gap-16 w-full animate-in fade-in duration-500 pointer-events-auto";

    // Card constants (overlay: relative to flex row, vertically centered)
    // Card constants (overlay: relative to flex row, vertically centered)
    const overlayCardClass = "flex flex-col items-center justify-center relative p-6 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-xl min-w-[300px] transition-transform duration-500 transform";
    const normalCardClass = "card flex flex-col items-center justify-center transition-colors relative p-2 flex-1 min-w-0 max-w-md cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all";

    const getPlayerCardClass = (isOverlay: boolean) => {
        if (isOverlay) return overlayCardClass;
        return normalCardClass;
    };

    const getTargetStyle = (isTarget: boolean, player: 'p1' | 'p2') => {
        if (!isTarget) return {
            opacity: 0.6,
            border: '4px solid rgba(255, 255, 255, 0.2)', // Match border width of active state (4px) to prevent layout shift
            padding: '1.5rem' // Standard padding (p-6)
        };
        return {
            border: `4px solid ${player === 'p1' ? 'rgba(239, 68, 68, 1)' : 'rgba(59, 130, 246, 1)'}`,
            boxShadow: `0 0 15px ${player === 'p1' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'}`,
            backgroundColor: player === 'p1' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            opacity: 1,
            padding: '1.5rem' // Standard p-6 padding
        };
    };

    return (
        <div
            className={isOverlay ? overlayWrapperClass : "flex flex-col h-full w-full overflow-hidden"}
            style={isOverlay ? {
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                pointerEvents: 'none'
            } : undefined}
        >
            {/* Life Display Area (Fixed Header) */}
            <div className={`flex-none w-full ${isOverlay ? '' : 'max-w-5xl mx-auto px-4'} z-10`}>
                <div className={isOverlay ? overlayRowClass : "flex flex-row items-center justify-center gap-4 w-full py-4"}>

                    {/* Player 1 (You) */}
                    <div
                        className={getPlayerCardClass(!!isOverlay)}
                        style={{
                            transform: isOverlay && p1.isRotated ? 'rotate(180deg)' : undefined,
                            ...(!isOverlay ? getTargetStyle(targetPlayer === 'p1', 'p1') : {})
                        }}
                        onClick={() => !isOverlay && setTargetPlayer('p1')}
                    >

                        {/* Rotation Toggle Button (Absolute Top-Right) */}
                        {!isOverlay && (
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleRotation('p1'); }}
                                // Using standard CSS for positioning since Tailwind might be unreliable
                                className={`p-1 rounded-full hover:bg-white/10 transition-colors ${p1.isRotated ? 'text-red-400 bg-red-500/20' : 'text-gray-400'}`}
                                style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 30 }}
                                title="180度回転 (オーバーレイ用)"
                            >
                                <RotateCcw size={16} className={p1.isRotated ? 'rotate-180' : ''} />
                            </button>
                        )}

                        <div className="w-full flex justify-center items-center mb-1">
                            <div className="text-sm opacity-80 uppercase tracking-widest font-bold flex items-center gap-2 text-red-300 font-orbitron" style={{ paddingLeft: '8px' }}>
                                Player 1
                            </div>
                        </div>

                        {/* Life Points Display */}
                        <div className="relative w-full text-center">
                            {isOverlay ? (
                                <DigitalDisplay
                                    value={p1.life}
                                    color="red"
                                    className={`transition-all duration-300 ${p1.life === 0 ? 'grayscale opacity-50' : ''}`}
                                />
                            ) : (
                                <div className={`text-4xl font-bold font-mono tracking-tighter my-1 text-red-400 ${p1.life === 0 ? 'opacity-50' : ''} ${targetPlayer === 'p1' ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]' : ''} transition-all`}>
                                    {p1.life}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dice/Coin Center Display (Always visible) */}
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

                    {/* Player 2 (Opponent) */}
                    <div
                        className={getPlayerCardClass(!!isOverlay)}
                        style={{
                            transform: isOverlay && p2.isRotated ? 'rotate(180deg)' : undefined,
                            ...(!isOverlay ? getTargetStyle(targetPlayer === 'p2', 'p2') : {})
                        }}
                        onClick={() => !isOverlay && setTargetPlayer('p2')}
                    >


                        {/* Rotation Toggle Button (Absolute Top-Right) */}
                        {!isOverlay && (
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleRotation('p2'); }}
                                // Using standard CSS for positioning since Tailwind might be unreliable
                                className={`p-1 rounded-full hover:bg-white/10 transition-colors ${p2.isRotated ? 'text-blue-400 bg-blue-500/20' : 'text-gray-400'}`}
                                style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 30 }}
                                title="180度回転 (オーバーレイ用)"
                            >
                                <RotateCcw size={16} className={p2.isRotated ? 'rotate-180' : ''} />
                            </button>
                        )}

                        <div className="w-full flex justify-center items-center mb-1">
                            <div className="text-sm opacity-80 uppercase tracking-widest font-bold flex items-center gap-2 text-blue-300 font-orbitron" style={{ paddingLeft: '8px' }}>
                                Player 2
                            </div>
                        </div>

                        {/* Life Points Display */}
                        <div className="relative w-full text-center">
                            {isOverlay ? (
                                <DigitalDisplay
                                    value={p2.life}
                                    color="blue"
                                    className={`transition-all duration-300 ${p2.life === 0 ? 'grayscale opacity-50' : ''}`}
                                />
                            ) : (
                                <div className={`text-4xl font-bold font-mono tracking-tighter my-1 text-blue-400 ${p2.life === 0 ? 'opacity-50' : ''} ${targetPlayer === 'p2' ? 'scale-110 drop-shadow-[0_0_10px_rgba(0,0,255,0.5)]' : ''} transition-all`}>
                                    {p2.life}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Body Content */}
            {!isOverlay && (
                <div className="flex-1 w-full overflow-y-auto min-h-0">
                    <div className="w-full max-w-5xl mx-auto px-4 pb-4">
                        {/* Calculator Panel */}
                        <div className="card p-2 animate-in slide-in-from-bottom duration-200 mt-2 w-1/2 min-w-[300px] mx-auto">
                            {/* Display Screen */}
                            <div className="flex justify-between items-center mb-2 bg-black/40 p-2 rounded border border-white/5">
                                <div className="text-xs text-gray-400 font-mono">
                                    <span className={targetPlayer === 'p1' ? 'text-red-400 font-bold' : 'text-blue-400 font-bold'}>
                                        {targetPlayer === 'p1' ? 'Player 1' : 'Player 2'}
                                    </span>
                                </div>
                                <div className="text-2xl font-mono text-right min-h-[32px] tracking-wider text-white">
                                    {inputValue || '0'}
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                                {/* Row 1 */}
                                {[7, 8, 9].map(n => (
                                    <button key={n} onClick={() => handleNumClick(n)} className="btn bg-slate-700/50 hover:bg-slate-600 p-3 text-lg font-bold w-full">{n}</button>
                                ))}
                                <button onClick={handleClear} className="btn bg-gray-600 hover:bg-gray-500 p-3 text-sm font-bold text-yellow-200 w-full">CLR</button>

                                {/* Row 2 */}
                                {[4, 5, 6].map(n => (
                                    <button key={n} onClick={() => handleNumClick(n)} className="btn bg-slate-700/50 hover:bg-slate-600 p-3 text-lg font-bold w-full">{n}</button>
                                ))}
                                <button onClick={() => handleOperation('+')} className="btn bg-green-900/60 hover:bg-green-800 text-green-100 p-3 text-xl font-bold border-green-700/50 w-full">+</button>

                                {/* Row 3 */}
                                {[1, 2, 3].map(n => (
                                    <button key={n} onClick={() => handleNumClick(n)} className="btn bg-slate-700/50 hover:bg-slate-600 p-3 text-lg font-bold w-full">{n}</button>
                                ))}
                                <button onClick={() => handleOperation('-')} className="btn bg-red-900/60 hover:bg-red-800 text-red-100 p-3 text-xl font-bold border-red-700/50 w-full">-</button>

                                {/* Row 4 */}
                                <button onClick={() => handleNumClick(0)} className="btn bg-slate-700/50 hover:bg-slate-600 p-3 text-lg font-bold w-full">0</button>
                                <button onClick={() => handleNumClick('00')} className="btn bg-slate-700/50 hover:bg-slate-600 p-3 text-lg font-bold px-1 w-full">00</button>
                                <button onClick={() => handleNumClick('000')} className="btn bg-slate-700/50 hover:bg-slate-600 p-3 text-lg font-bold px-1 w-full">000</button>
                                <button onClick={handleHalf} className="btn bg-indigo-900/60 hover:bg-indigo-800 text-indigo-100 p-3 text-sm font-bold border-indigo-700/50 w-full">÷2</button>

                                {/* Row 5: Undo / Redo */}
                                <button
                                    onClick={handleUndo}
                                    disabled={currentStep <= 0}
                                    style={{ gridColumn: 'span 2' }}
                                    className="btn bg-blue-900/60 hover:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed text-blue-100 p-2 text-sm font-bold border-blue-700/50 w-full flex items-center justify-center gap-2"
                                >
                                    <Undo2 size={18} />
                                </button>
                                <button
                                    onClick={handleRedo}
                                    disabled={currentStep >= history.length - 1}
                                    style={{ gridColumn: 'span 2' }}
                                    className="btn bg-blue-900/60 hover:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed text-blue-100 p-2 text-sm font-bold border-blue-700/50 w-full flex items-center justify-center gap-2"
                                >
                                    <Redo2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Log Display */}
                        <div className="flex gap-4 opacity-50 text-[10px] justify-center mt-2 pb-8">
                            <div>
                                <History size={10} className="inline mr-1" />
                                P1: {p1.log.slice(0, 3).join(' ← ')}...
                            </div>
                            <div>
                                P2: {p2.log.slice(0, 3).join(' ← ')}...
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
