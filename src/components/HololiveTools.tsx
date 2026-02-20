import React from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { CardSearchContainer } from './CardSearch/CardSearchContainer';
import { OverlayDisplay } from './OverlayDisplay';
import { useCardSearch } from '../hooks/useCardSearch';
import { SPMarkerWidget } from './CardSearch/SPMarkerWidget';

interface HololiveToolsProps {
    isOverlay?: boolean;
    diceValue?: number;
    coinValue?: string;
    diceKey?: number;
    coinKey?: number;
    onDiceClick?: () => void;
    onCoinClick?: () => void;
    obsMode?: 'normal' | 'green';
}
const EnergyIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 20 }) => {
    const base = import.meta.env.BASE_URL;
    const colorMap: Record<string, string> = {
        '赤': 'red',
        '青': 'blue',
        '緑': 'green',
        '白': 'white',
        '黄': 'yellow',
        '紫': 'purple',
        '◇': 'null'
    };

    const iconName = colorMap[color] || 'null';
    const rawPath = `/images/icons/arts_${iconName}.png`;

    // Resolve path using base URL logic
    let path = rawPath;
    if (path.startsWith(base)) path = path.slice(base.length);
    if (path.startsWith('/')) path = path.slice(1);
    const resolvedPath = base + path;

    return (
        <img
            src={resolvedPath}
            alt={color}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                display: 'inline-block',
                verticalAlign: 'middle',
                objectFit: 'contain'
            }}
        />
    );
};

const TypeIcon: React.FC<{ color: string; height?: number }> = ({ color, height = 32 }) => {
    const base = import.meta.env.BASE_URL;
    const colorMap: Record<string, string> = {
        '赤': 'red',
        '青': 'blue',
        '緑': 'green',
        '白': 'white',
        '黄': 'yellow',
        '紫': 'purple',
        '◇': 'null'
    };

    const colorKey = Array.from(color)
        .map(c => colorMap[c])
        .filter(Boolean)
        .join('_') || 'null';

    const iconName = `type_${colorKey}.png`;
    const rawPath = `/images/icons/${iconName}`;

    let path = rawPath;
    if (path.startsWith(base)) path = path.slice(base.length);
    if (path.startsWith('/')) path = path.slice(1);
    const resolvedPath = base + path;

    return (
        <img
            src={resolvedPath}
            alt={color}
            style={{
                height: `${height}px`,
                width: 'auto',
                display: 'block',
                objectFit: 'contain'
            }}
        />
    );
};

// --- 【調整用】追従モードの位置・サイズ設定 ---
export const OVERLAY_SP_MARKER_BOTTOM = '0px'; // 下端からのオフセット（マイナスで上へ移動）
export const OVERLAY_CARD_RADIUS = '17px';      // カードの角丸
export const FOLLOW_MODE_MARKER_ONLY_HEIGHT = '250px'; // カード非表示・マーカーのみの時の仮想的な高さ
// ------------------------------------------

export const HololiveTools: React.FC<HololiveToolsProps> = ({
    isOverlay = false,
    diceValue = 1,
    coinValue = '表',
    diceKey = 0,
    coinKey = 0,
    onDiceClick,
    onCoinClick
}) => {
    const {
        overlayCard,
        overlayMode,
        overlayDisplayMode,
        pinnedCards,
        setOverlayForcedCard,
        spMarkerMode,
        spMarkerFace,
        toggleSPMarkerFace,
        showSPMarkerForceHidden
    } = useCardSearch();

    const inputBufferRef = React.useRef("");
    const timerRef = React.useRef<number | null>(null);

    // Keyboard Shortcuts (Hololive Overlay Pin Select)
    // Only enabled in the separate overlay window (multi-digit support up to 1000)
    React.useEffect(() => {
        const isOverlayWindow = new URLSearchParams(window.location.search).get('mode') === 'overlay';
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

    // Overlay View: Only show result and image
    if (isOverlay) {
        const isOverlayEnabled = overlayMode !== 'off';

        // Background should be transparent when in obs modes to let the body background show through
        // Background should be solid for card frame to block the chroma key background

        return (
            <div className="relative w-fit h-fit min-w-[400px] pointer-events-auto flex flex-col items-center">
                {/* 0. Centered Dice/Coin: Shown at the top when the main overlay is OFF */}
                {!isOverlayEnabled && (
                    <div className={spMarkerMode === 'follow' ? 'mb-4' : 'mb-8'}>
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

                <div className="relative w-fit h-fit">

                    {/* 1. Dice/Coin Overlay: Shown when the main overlay is ON */}
                    {isOverlayEnabled && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center pointer-events-none">
                            <div className="flex flex-col items-center w-full h-full transition-all duration-500 justify-start mt-[-25px]">
                                <div className="pointer-events-auto shadow-2xl bg-black/60 backdrop-blur-sm px-2 pt-0 pb-1 rounded-b-xl">
                                    <OverlayDisplay
                                        diceValue={diceValue}
                                        coinValue={coinValue}
                                        diceKey={diceKey}
                                        coinKey={coinKey}
                                        onDiceClick={onDiceClick}
                                        onCoinClick={onCoinClick}
                                        compact={false}
                                        showCoin={false}
                                        className="pointer-events-auto scale-75 origin-center"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Card Display Area: Dynamic height frame */}
                    {(isOverlayEnabled || spMarkerMode === 'follow') && (
                        <div className="overlay-card-frame relative flex flex-col items-center justify-start animate-in zoom-in duration-500 transform"
                            style={{
                                width: '400px',
                                height: isOverlayEnabled ? '560px' : FOLLOW_MODE_MARKER_ONLY_HEIGHT,
                                backgroundColor: 'transparent',
                                border: 'none',
                                boxShadow: 'none',
                                borderRadius: OVERLAY_CARD_RADIUS
                            }}>

                            {/* 2. Card/Placeholder Area: Fills the remaining space and centers the content */}
                            <div className="flex-1 w-full flex items-center justify-center p-0">
                                {isOverlayEnabled && (
                                    overlayCard ? (
                                        overlayDisplayMode === 'image' ? (
                                            <div className="h-full aspect-[63/88] overflow-hidden bg-black flex items-center justify-center relative"
                                                style={{ borderRadius: OVERLAY_CARD_RADIUS }}>
                                                <img
                                                    src={overlayCard.resolvedImageUrl || overlayCard.imageUrl}
                                                    alt={overlayCard.name}
                                                    className="h-full w-full object-cover scale-100 animate-in fade-in zoom-in duration-300 transition-transform"
                                                />
                                            </div>
                                        ) : (
                                            <div className="overlay-text-container w-full h-full bg-[#111827] border border-white/20 text-white flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 transition-transform relative"
                                                style={{
                                                    backgroundColor: '#111827',
                                                    padding: '24px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    boxSizing: 'border-box',
                                                    borderRadius: OVERLAY_CARD_RADIUS
                                                }}>

                                                {/* Scrollable Main Content */}
                                                <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ paddingRight: '10px' }}>
                                                    {/* Header */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '12px', marginBottom: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            {(overlayCard.cardType?.includes('ホロメン') || overlayCard.cardType === '推しホロメン') && (
                                                                <TypeIcon color={overlayCard.color} height={45} />
                                                            )}
                                                            <div style={{ fontSize: '25px', fontWeight: 'bold', letterSpacing: '0.05em', opacity: 0.9 }}>
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
                                                        </div>
                                                        {overlayCard.hp && (
                                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                <span className="font-orbitron" style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', whiteSpace: 'nowrap', lineHeight: 1 }}>
                                                                    {overlayCard.cardType === '推しホロメン' ? '❤' : 'HP'} {overlayCard.hp}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 12px 0', lineHeight: 1.2, color: '#ffffff' }}>
                                                            {overlayCard.name}
                                                        </h2>
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
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                                                    {art.costs.map((cost, ci) => (
                                                                                        <EnergyIcon key={ci} color={cost} size={18} />
                                                                                    ))}
                                                                                </div>
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
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.8, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                                    {overlayCard.tags && overlayCard.tags.split(' ').filter(t => t).map((tag, ti) => (
                                                                        <span key={ti} style={{ color: '#60a5fa', fontWeight: '500', fontSize: '12px' }}>{tag}</span>
                                                                    ))}
                                                                </div>
                                                                {(overlayCard.batonTouch || overlayCard.cardType?.includes('ホロメン')) && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '12px', marginLeft: '4px' }}>
                                                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' }}>バトンタッチ</span>
                                                                        {overlayCard.batonTouch && (
                                                                            <EnergyIcon color={overlayCard.batonTouch} size={20} />
                                                                        )}
                                                                    </div>
                                                                )}
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
                                        <div className="flex flex-col items-center justify-center text-white/40 gap-4 animate-pulse transition-transform">
                                            <Search size={64} strokeWidth={1} />
                                            <p className="text-xl font-bold tracking-widest font-orbitron">CARD SELECTING...</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* SP Marker: Moved outside to avoid clipping by overflow-hidden container */}
                    {spMarkerMode === 'follow' && !showSPMarkerForceHidden && overlayCard && (
                        <div
                            className="absolute z-50 animate-in slide-in-from-bottom-10 duration-500"
                            style={{
                                bottom: OVERLAY_SP_MARKER_BOTTOM,
                                left: '50%',
                                transform: 'translateX(-50%)'
                            }}
                        >
                            <SPMarkerWidget
                                face={spMarkerFace}
                                onToggle={toggleSPMarkerFace}
                                isFollowMode={true}
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
