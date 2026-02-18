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
    onCoinClick
}) => {
    const { overlayCard, overlayMode, overlayDisplayMode } = useCardSearch();

    // Overlay View: Only show result and image
    if (isOverlay) {
        const isOverlayEnabled = overlayMode !== 'off';
        const isRotated = overlayMode === 'rotated';

        // Background should be transparent when in obs modes to let the body background show through
        // Background should be solid for card frame to block the chroma key background

        return (
            <div
                className="fixed inset-0 z-50 flex flex-col items-center justify-center p-0 m-0"
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
                        <div className="overlay-card-frame relative flex flex-col items-center justify-start rounded-3xl animate-in zoom-in duration-500 transform overflow-hidden"
                            style={{
                                width: '350px',
                                height: '520px',
                                backgroundColor: '#111827',
                                border: `1px solid rgba(203, 213, 225, 0.4)`,
                                boxShadow: 'none'
                            }}>

                            {/* 1. Dice/Coin Overlay: Flexible Layer that stacks over the frame */}
                            <div className="absolute inset-0 z-30 flex flex-col items-center pointer-events-none p-1">
                                <div className={`flex flex-col items-center w-full h-full transition-all duration-500 ${isRotated ? 'justify-end pb-2' : 'justify-start pt-2'}`}>
                                    <div className="pointer-events-auto shadow-2xl rounded-xl bg-black/60 backdrop-blur-sm p-1">
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
                                    overlayDisplayMode === 'image' ? (
                                        <img
                                            src={overlayCard.resolvedImageUrl || overlayCard.imageUrl}
                                            alt={overlayCard.name}
                                            className={`h-[480px] w-auto object-contain drop-shadow-2xl animate-in fade-in zoom-in duration-300 transition-transform ${isRotated ? 'rotate-180' : ''}`}
                                        />
                                    ) : (
                                        <div className={`overlay-text-container w-full h-[480px] bg-[#111827] rounded-lg border border-white/10 p-4 text-white overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-300 transition-transform ${isRotated ? 'rotate-180' : ''}`}
                                            style={{ backgroundColor: '#111827' }}>
                                            {/* Header */}
                                            <div className="border-b border-white/20 pb-2 mb-3">
                                                <div className="text-xl tracking-wider mb-1 font-bold text-white">
                                                    {(() => {
                                                        const type = overlayCard.cardType || '';
                                                        const bloom = overlayCard.bloomLevel || '';
                                                        if (type.includes('ホロメン') && type !== '推しホロメン') {
                                                            return `${bloom}${type.includes('Buzz') ? ' Buzz' : ''}`;
                                                        }
                                                        // Support cards: remove "サポート・", "LIMITED" and any leftover dots
                                                        if (type.includes('サポート')) {
                                                            return type
                                                                .replace(/サポート・/g, '')
                                                                .replace(/・?LIMITED/g, '')
                                                                .replace(/^・+|・+$/g, '')
                                                                .trim();
                                                        }
                                                        return type;
                                                    })()}
                                                </div>
                                                <div className="flex justify-between items-start gap-2">
                                                    {(() => {
                                                        const color = overlayCard.color || '';
                                                        let textColor = '#9ca3af'; // gray-400
                                                        if (color.includes('赤')) textColor = '#f87171'; // red-400
                                                        else if (color.includes('青')) textColor = '#60a5fa'; // blue-400
                                                        else if (color.includes('黄')) textColor = '#facc15'; // yellow-400
                                                        else if (color.includes('緑')) textColor = '#34d399'; // emerald-400
                                                        else if (color.includes('紫')) textColor = '#c084fc'; // purple-400
                                                        else if (color.includes('白')) textColor = '#e2e8f0'; // slate-200

                                                        return (
                                                            <h2 className="text-xl font-bold leading-tight" style={{ color: textColor }}>
                                                                {overlayCard.name}
                                                            </h2>
                                                        );
                                                    })()}
                                                    {overlayCard.hp && (
                                                        <span className="text-xl font-bold text-red-400 font-orbitron shrink-0">
                                                            {overlayCard.cardType === '推しホロメン' ? '❤' : 'HP'} {overlayCard.hp}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Oshi Skills */}
                                            {overlayCard.oshiSkills && overlayCard.oshiSkills.length > 0 && (
                                                <div className="space-y-3 mb-4">
                                                    {overlayCard.oshiSkills.map((skill, i) => (
                                                        <div key={i} className="bg-blue-900/30 border-l-2 border-blue-500 p-2 rounded-r">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-bold text-blue-300 uppercase tracking-tighter">{skill.label}</span>
                                                                <span className="text-xs bg-blue-500/20 px-1 rounded">ホロパワー: {skill.cost}</span>
                                                            </div>
                                                            <div className="font-bold text-sm text-blue-100 mb-1">{skill.name}</div>
                                                            <div className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap">{skill.text}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Arts */}
                                            {overlayCard.arts && overlayCard.arts.length > 0 && (
                                                <div className="space-y-3 mb-4">
                                                    {overlayCard.arts.map((art, i) => (
                                                        <div key={i} className="bg-red-900/20 border-l-2 border-red-500 p-2 rounded-r">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <div className="flex gap-1 items-center">
                                                                    {art.costs.map((c, ci) => <span key={ci} className="w-3 h-3 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[8px]" title={c}>{c[0]}</span>)}
                                                                </div>
                                                                <span className="text-sm font-bold text-red-400 font-orbitron">{art.damage}</span>
                                                            </div>
                                                            <div className="font-bold text-sm text-red-100 mb-1">
                                                                {art.name}
                                                                {art.tokkou && <span className="ml-2 text-[10px] bg-red-500/40 px-1 rounded text-white">{art.tokkou}</span>}
                                                            </div>
                                                            <div className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap">{art.text}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Keywords */}
                                            {overlayCard.keywords && overlayCard.keywords.length > 0 && (
                                                <div className="space-y-2 mb-4">
                                                    {overlayCard.keywords.map((kw, i) => (
                                                        <div key={i} className="text-xs">
                                                            <span className="font-bold text-yellow-400">【{kw.type}：{kw.name}】</span>
                                                            <span className="opacity-90 ml-1">{kw.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Ability Text (Support) */}
                                            {overlayCard.abilityText && (
                                                <div className="mb-4 text-xs leading-relaxed opacity-90 whitespace-pre-wrap">
                                                    {overlayCard.abilityText}
                                                </div>
                                            )}

                                            {/* Extra / LIMITED */}
                                            {(overlayCard.extra || overlayCard.limited) && (
                                                <div className="mt-4 pt-2 border-t border-white/10 text-[10px] opacity-60 italic">
                                                    {overlayCard.limited && <div className="text-yellow-500 font-bold not-italic mb-0.5">LIMITED: ターンに1枚しかつかえない</div>}
                                                    {overlayCard.extra}
                                                </div>
                                            )}
                                        </div>
                                    )
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
