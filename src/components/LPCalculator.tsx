import React, { useState, useEffect } from 'react';
import { Undo2, Redo2 } from 'lucide-react';

import { OverlayDisplay } from './OverlayDisplay';
import { DigitalDisplay } from './DigitalDisplay';

interface PlayerState {
    life: number;
    log: number[];
    isRotated?: boolean;
}

const CHANNEL_NAME = 'tcg_remote_sync_lp';

interface LPCalculatorProps {
    isOverlay?: boolean;
    diceValue?: number;
    coinValue?: string;
    diceKey?: number;
    coinKey?: number;
    onDiceClick?: () => void;
    onCoinClick?: () => void;
    obsMode?: 'normal' | 'green';
    // Widget Visibility & Settings
    isDiceVisible?: boolean;
    isCoinVisible?: boolean;
    isLPVisible?: boolean;
    initialLP?: number;
    onlyShowPlayer1?: boolean;
}

export const LPCalculator: React.FC<LPCalculatorProps> = ({
    isOverlay = false,
    diceValue = 1, coinValue = '表', diceKey = 0, coinKey = 0,
    onDiceClick, onCoinClick,
    obsMode = 'normal',
    isDiceVisible = true,
    isCoinVisible = true,
    isLPVisible = true,
    initialLP = 8000,
    onlyShowPlayer1 = false
}: LPCalculatorProps) => {
    const [p1, setP1] = useState<PlayerState>({ life: initialLP, log: [initialLP], isRotated: false });
    const [p2, setP2] = useState<PlayerState>({ life: initialLP, log: [initialLP], isRotated: false });
    const [inputValue, setInputValue] = useState<string>('');
    const [targetPlayer, setTargetPlayer] = useState<'p1' | 'p2' | null>('p1');

    const [history, setHistory] = useState<{ p1: PlayerState, p2: PlayerState }[]>([
        { p1: { life: initialLP, log: [initialLP], isRotated: false }, p2: { life: initialLP, log: [initialLP], isRotated: false } }
    ]);
    const [currentStep, setCurrentStep] = useState(0);

    // Sync Logic
    useEffect(() => {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = (event) => {
            const data = event.data;
            if (data.p1) setP1(data.p1);
            if (data.p2) setP2(data.p2);
            if (data.target !== undefined) setTargetPlayer(data.target);
            if (data.input !== undefined) setInputValue(data.input);
        };
        return () => channel.close();
    }, []);

    // Force P1 if onlyShowPlayer1 is on
    useEffect(() => {
        if (onlyShowPlayer1 && targetPlayer === 'p2') {
            setTargetPlayer('p1');
            broadcastSync({ target: 'p1' });
        }
    }, [onlyShowPlayer1, targetPlayer]);

    const broadcastSync = (data: { p1?: PlayerState, p2?: PlayerState, target?: 'p1' | 'p2' | null, input?: string }) => {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage(data);
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
        broadcastSync({ p1: newP1, p2: newP2, target: targetPlayer });
    };

    const handleSetTarget = (player: 'p1' | 'p2' | null) => {
        if (onlyShowPlayer1 && player === 'p2') return;
        if (player === targetPlayer) return;
        setTargetPlayer(player);
        broadcastSync({ target: player });
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
            broadcastSync({ p1: restoredP1, p2: restoredP2, target: targetPlayer });
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
            broadcastSync({ p1: restoredP1, p2: restoredP2, target: targetPlayer });
        }
    };

    // Calculator Handlers
    const handleNumClick = (val: number | string) => {
        const strVal = val.toString();
        // Prevent 0, 00, 000 if input is empty or 0
        if ((inputValue === '' || inputValue === '0') && (strVal === '0' || strVal === '00' || strVal === '000')) {
            return;
        }

        const next = inputValue === '0' ? strVal : inputValue + strVal;
        setInputValue(next);
        broadcastSync({ input: next });
    };

    const handleClear = () => {
        setInputValue('');
        broadcastSync({ input: '' });
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
        broadcastSync({ input: '' });
    };

    const handleHalf = () => {
        if (!targetPlayer) return;
        const currentLife = targetPlayer === 'p1' ? p1.life : p2.life;
        updateLife(targetPlayer, Math.ceil(currentLife / 2));
    };

    const handleToggleTarget = () => {
        const next = targetPlayer === 'p1' ? 'p2' : 'p1';
        handleSetTarget(next);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
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
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
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

            // Target Toggle
            if (e.key === 'p' || e.key === 'P' || e.key === '*' || e.key === 'Multiply') {
                e.preventDefault();
                handleToggleTarget();
                return;
            }

            // Target Selection (Arrow Keys)
            if (e.key === 'ArrowUp') {
                if (!isOverlay) return; // Ignore Up in operation screen
                e.preventDefault();
                handleSetTarget('p2');
                return;
            }
            if (e.key === 'ArrowDown') {
                if (!isOverlay) return; // Ignore Down in operation screen
                e.preventDefault();
                handleSetTarget('p1');
                return;
            }
            if (e.key === 'ArrowLeft') {
                if (isOverlay) return; // Ignore Left in overlay
                e.preventDefault();
                handleSetTarget('p1');
                return;
            }
            if (e.key === 'ArrowRight') {
                if (isOverlay) return; // Ignore Right in overlay
                e.preventDefault();
                handleSetTarget('p2');
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOverlay, onlyShowPlayer1, handleNumClick, handleOperation, handleHalf, handleClear, handleUndo, handleRedo, handleSetTarget, handleToggleTarget, p1, p2, targetPlayer]);

    const getPlayerCardClass = (isOverlay: boolean) => {
        if (isOverlay) return "flex flex-col items-center justify-center relative p-3 rounded-2xl transition-all duration-500 transform";
        return "card flex flex-col items-center justify-center transition-colors relative p-2 flex-1 min-w-0 max-w-md cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all";
    };

    const getTargetStyle = (isTarget: boolean, player: 'p1' | 'p2', activeOverlay: boolean) => {
        // Use solid backgrounds for labels to ensure they are visible over video feed
        const solidBg = '#111827';
        const targetBgP1 = '#1b1414';
        const targetBgP2 = '#141b2d';

        if (!isTarget) return {
            opacity: activeOverlay ? 1 : 0.6,
            border: activeOverlay ? '4px solid rgba(255, 255, 255, 0.1)' : '4px solid rgba(255, 255, 255, 0.05)',
            padding: activeOverlay ? '0.75rem 1.5rem' : '1.5rem',
            backgroundColor: activeOverlay ? solidBg : undefined,
            boxShadow: 'none'
        };

        // Focus State
        return {
            border: `4px solid ${player === 'p1' ? '#ef4444' : '#3b82f6'}`,
            boxShadow: `0 0 20px ${player === 'p1' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)'}`,
            backgroundColor: activeOverlay
                ? (player === 'p1' ? targetBgP1 : targetBgP2)
                : (player === 'p1' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'),
            opacity: 1,
            padding: activeOverlay ? '0.75rem 1.5rem' : '1.5rem'
        };
    };


    return (
        <div
            className={isOverlay ? "relative w-fit h-fit pointer-events-auto" : "flex flex-col h-full w-full overflow-hidden"}
        >
            <div className={`flex-none ${isOverlay ? 'w-fit' : 'w-full max-w-5xl mx-auto px-4'} z-10`}>
                <div className={isOverlay ? "flex flex-col items-center justify-center gap-1 w-fit animate-in fade-in duration-500 pointer-events-auto" : "flex flex-row items-center justify-center gap-4 w-full py-4"}>

                    {isOverlay ? (
                        <>
                            {/* Player 2 (Opponent) - Always Rotated 180 in Overlay */}
                            {isLPVisible && !onlyShowPlayer1 && (
                                <div
                                    className={getPlayerCardClass(true)}
                                    style={{
                                        transform: 'rotate(180deg)',
                                        ...getTargetStyle(targetPlayer === 'p2', 'p2', true)
                                    }}
                                    onClick={() => handleSetTarget('p2')}
                                >
                                    <div className="w-full flex justify-center items-center mb-1">
                                        <div className="text-sm opacity-80 uppercase tracking-widest font-bold flex items-center gap-2 text-blue-300 font-orbitron" style={{ paddingLeft: '8px' }}>
                                            Player 2
                                        </div>
                                    </div>

                                    <div className="relative w-full text-center">
                                        <DigitalDisplay
                                            value={p2.life}
                                            color="blue"
                                            obsMode={obsMode}
                                            className={`transition-all duration-300 ${p2.life === 0 ? 'grayscale opacity-50' : ''}`}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Dice/Coin Center Display */}
                            {(isDiceVisible || isCoinVisible) && (
                                <OverlayDisplay
                                    diceValue={diceValue}
                                    coinValue={coinValue}
                                    diceKey={diceKey}
                                    coinKey={coinKey}
                                    onDiceClick={onDiceClick}
                                    onCoinClick={onCoinClick}
                                    compact={false}
                                    className="pointer-events-auto shrink-0 flex-none"
                                    showDice={isDiceVisible}
                                    showCoin={isCoinVisible}
                                />
                            )}

                            {/* Player 1 (You) */}
                            {isLPVisible && (
                                <div
                                    className={getPlayerCardClass(true)}
                                    style={{
                                        ...getTargetStyle(targetPlayer === 'p1', 'p1', true)
                                    }}
                                    onClick={() => handleSetTarget('p1')}
                                >
                                    <div className="w-full flex justify-center items-center mb-1">
                                        <div className="text-sm opacity-80 uppercase tracking-widest font-bold flex items-center gap-2 text-red-300 font-orbitron" style={{ paddingLeft: '8px' }}>
                                            Player 1
                                        </div>
                                    </div>

                                    <div className="relative w-full text-center">
                                        <DigitalDisplay
                                            value={p1.life}
                                            color="red"
                                            obsMode={obsMode}
                                            className={`transition-all duration-300 ${p1.life === 0 ? 'grayscale opacity-50' : ''}`}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Player 1 (You) */}
                            {isLPVisible && (
                                <div
                                    className={getPlayerCardClass(false)}
                                    style={getTargetStyle(targetPlayer === 'p1', 'p1', false)}
                                    onClick={() => handleSetTarget('p1')}
                                >
                                    <div className="w-full flex justify-center items-center mb-1">
                                        <div className="text-sm opacity-80 uppercase tracking-widest font-bold flex items-center gap-2 text-red-300 font-orbitron" style={{ paddingLeft: '8px' }}>
                                            Player 1
                                        </div>
                                    </div>

                                    <div className="relative w-full text-center">
                                        <div className={`text-4xl font-bold font-mono tracking-tighter my-1 text-red-400 ${p1.life === 0 ? 'opacity-50' : ''} ${targetPlayer === 'p1' ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]' : ''} transition-all`}>
                                            {p1.life}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Dice/Coin Center Display */}
                            {(isDiceVisible || isCoinVisible) && (
                                <OverlayDisplay
                                    diceValue={diceValue}
                                    coinValue={coinValue}
                                    diceKey={diceKey}
                                    coinKey={coinKey}
                                    onDiceClick={onDiceClick}
                                    onCoinClick={onCoinClick}
                                    compact={true}
                                    className="pointer-events-auto shrink-0 flex-none"
                                    showDice={isDiceVisible}
                                    showCoin={isCoinVisible}
                                />
                            )}

                            {/* Player 2 (Opponent) */}
                            {isLPVisible && !onlyShowPlayer1 && (
                                <div
                                    className={getPlayerCardClass(false)}
                                    style={getTargetStyle(targetPlayer === 'p2', 'p2', false)}
                                    onClick={() => handleSetTarget('p2')}
                                >
                                    <div className="w-full flex justify-center items-center mb-1">
                                        <div className="text-sm opacity-80 uppercase tracking-widest font-bold flex items-center gap-2 text-blue-300 font-orbitron" style={{ paddingLeft: '8px' }}>
                                            Player 2
                                        </div>
                                    </div>

                                    <div className="relative w-full text-center">
                                        <div className={`text-4xl font-bold font-mono tracking-tighter my-1 text-blue-400 ${p2.life === 0 ? 'opacity-50' : ''} ${targetPlayer === 'p2' ? 'scale-110 drop-shadow-[0_0_10px_rgba(0,0,255,0.5)]' : ''} transition-all`}>
                                            {p2.life}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
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
                    </div>
                </div>
            )}
        </div>
    );
};
