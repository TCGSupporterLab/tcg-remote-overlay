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
                                        <div className={`overlay-text-container w-full h-[480px] bg-[#111827] rounded-lg border border-white/10 text-white flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 transition-transform ${isRotated ? 'rotate-180' : ''}`}
                                            style={{
                                                backgroundColor: '#111827',
                                                padding: '24px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                boxSizing: 'border-box'
                                            }}>

                                            {/* Scrollable Main Content */}
                                            <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ paddingRight: '10px' }}>
                                                {/* Header */}
                                                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '12px', marginBottom: '20px' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '4px', opacity: 0.8 }}>
                                                        {(() => {
                                                            const type = overlayCard.cardType || '';
                                                            const bloom = overlayCard.bloomLevel || '';
                                                            if (type.includes('ホロメン') && type !== '推しホロメン') {
                                                                return `${bloom}${type.includes('Buzz') ? ' Buzz' : ''}`;
                                                            }
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
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                                                        {(() => {
                                                            const isRed = overlayCard.color === '赤';
                                                            const isBlue = overlayCard.color === '青';
                                                            const isPurple = overlayCard.color === '紫';
                                                            const isWhite = overlayCard.color === '白';
                                                            const textColor = isRed ? '#f87171' : isBlue ? '#60a5fa' : isPurple ? '#c084fc' : isWhite ? '#e2e8f0' : '#fbbf24';
                                                            return (
                                                                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, lineHeight: 1.2, color: textColor }}>
                                                                    {overlayCard.name}
                                                                </h2>
                                                            );
                                                        })()}
                                                        {overlayCard.hp && (
                                                            <span className="font-orbitron" style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', whiteSpace: 'nowrap' }}>
                                                                {overlayCard.cardType === '推しホロメン' ? '❤' : 'HP'} {overlayCard.hp}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Skills/Arts/Keywords/Ability (Summary) */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                    {overlayCard.oshiSkills && overlayCard.oshiSkills.length > 0 && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                            {overlayCard.oshiSkills.map((skill, i) => (
                                                                <div key={i} style={{ backgroundColor: 'rgba(30, 58, 138, 0.4)', borderLeft: '4px solid #3b82f6', padding: '12px', borderRadius: '0 4px 4px 0' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{skill.label}</span>
                                                                        <span style={{ fontSize: '11px', backgroundColor: 'rgba(59, 130, 246, 0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>ホロパワー: {skill.cost}</span>
                                                                    </div>
                                                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#eff6ff', marginBottom: '4px' }}>{skill.name}</div>
                                                                    <div style={{ fontSize: '13px', lineHeight: '1.6', opacity: 0.9, whiteSpace: 'pre-wrap' }}>{skill.text}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {overlayCard.arts && overlayCard.arts.length > 0 && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                            {overlayCard.arts.map((art, i) => (
                                                                <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>{art.name}</div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                            <span style={{ fontSize: '14px', fontWeight: 'bold', opacity: 0.7 }}>{art.costs.join('')}</span>
                                                                            <span className="font-orbitron" style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{art.damage}</span>
                                                                        </div>
                                                                    </div>
                                                                    {art.text && <div style={{ fontSize: '13px', lineHeight: '1.6', opacity: 0.9, whiteSpace: 'pre-wrap' }}>{art.text}</div>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {overlayCard.keywords && overlayCard.keywords.length > 0 && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                            {overlayCard.keywords.map((kw, i) => (
                                                                <div key={i} style={{ fontSize: '13px' }}>
                                                                    <span style={{ fontWeight: 'bold', color: '#eab308' }}>【{kw.type}：{kw.name}】</span>
                                                                    <span style={{ opacity: 0.9, marginLeft: '8px' }}>{kw.text}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {overlayCard.abilityText && (
                                                        <div style={{ fontSize: '13px', lineHeight: '1.6', opacity: 0.9, whiteSpace: 'pre-wrap' }}>
                                                            {overlayCard.abilityText
                                                                .replace(/^[◆・]?(LIMITED|imited)\s*/i, '')
                                                                .replace(/LIMITED：?ターンに[1１]枚しか使えない。?\s*/g, '')
                                                                .trim()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Footer Area: Fixed at the bottom */}
                                            {(overlayCard.extra || overlayCard.limited || overlayCard.tags) && (
                                                <div style={{ marginTop: '20px', flexShrink: 0 }}>
                                                    {overlayCard.extra && (
                                                        <div style={{ fontSize: '11px', fontStyle: 'italic', opacity: 0.6, marginBottom: '12px', lineHeight: 1.4 }}>
                                                            {overlayCard.extra}
                                                        </div>
                                                    )}
                                                    <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '12px', opacity: 0.8, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                            {overlayCard.tags && overlayCard.tags.split(' ').filter(t => t).map((tag, ti) => (
                                                                <span key={ti} style={{ color: '#60a5fa', fontWeight: '500', fontSize: '12px' }}>{tag}</span>
                                                            ))}
                                                        </div>
                                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                            {overlayCard.limited && <div style={{ color: '#eab308', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.05em' }}>LIMITED</div>}
                                                        </div>
                                                    </div>
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
