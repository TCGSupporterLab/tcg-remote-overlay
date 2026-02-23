import React from 'react';
import '../animations.css';

interface ThreeDDiceProps {
    value: number;
    rolling: boolean;
}

export const ThreeDDice: React.FC<ThreeDDiceProps> = ({ value, rolling }) => {

    // Inline SVG Component for reliability
    const DiceFaceSVG = ({ num }: { num: number }) => {
        // Red Gradient Definition (reused in each SVG for isolation)
        const defs = (
            <defs>
                <radialGradient id={`redGradient-${num}`} cx="50%" cy="50%" r="70%" fx="30%" fy="30%">
                    <stop offset="0%" stopColor="#ff6b6b" />
                    <stop offset="100%" stopColor="#b90000" />
                </radialGradient>
                <filter id={`shadow-${num}`}>
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.5" />
                </filter>
            </defs>
        );

        const rect = <rect width="100" height="100" rx="16" fill={`url(#redGradient-${num})`} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />;

        // Larger, White dots for visibility
        // If user wants black, change fill="black"
        const dotColor = "white";
        const dotRadius = 10; // 20px diameter

        let dots = null;
        switch (num) {
            case 1:
                dots = <circle cx="50" cy="50" r="18" fill="gold" filter={`url(#shadow-${num})`} />;
                break;
            case 2:
                dots = (
                    <>
                        <circle cx="25" cy="25" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="75" cy="75" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                    </>
                );
                break;
            case 3:
                dots = (
                    <>
                        <circle cx="25" cy="25" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="50" cy="50" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="75" cy="75" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                    </>
                );
                break;
            case 4:
                dots = (
                    <>
                        <circle cx="25" cy="25" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="75" cy="25" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="25" cy="75" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="75" cy="75" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                    </>
                );
                break;
            case 5:
                dots = (
                    <>
                        <circle cx="25" cy="25" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="75" cy="25" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="50" cy="50" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="25" cy="75" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="75" cy="75" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                    </>
                );
                break;
            case 6:
                dots = (
                    <>
                        <circle cx="25" cy="20" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="25" cy="50" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="25" cy="80" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="75" cy="20" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="75" cy="50" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                        <circle cx="75" cy="80" r={dotRadius} fill={dotColor} filter={`url(#shadow-${num})`} />
                    </>
                );
                break;
            default: return null;
        }

        return (
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="rounded-xl shadow-inner">
                {defs}
                {rect}
                {dots}
            </svg>
        );
    };

    const getRotationClass = (val: number) => {
        switch (val) {
            case 1: return 'show-1';
            case 2: return 'show-2';
            case 3: return 'show-3';
            case 4: return 'show-4';
            case 5: return 'show-5';
            case 6: return 'show-6';
            default: return 'show-1';
        }
    };

    return (
        <div className="scene-3d pointer-events-none" style={{ width: '100%', height: '100%' }}>
            <div className={`cube ${rolling ? 'animate-rolling' : getRotationClass(value)}`}>
                <div className="cube__face cube__face--1"><DiceFaceSVG num={1} /></div>
                <div className="cube__face cube__face--2"><DiceFaceSVG num={2} /></div>
                <div className="cube__face cube__face--3"><DiceFaceSVG num={3} /></div>
                <div className="cube__face cube__face--4"><DiceFaceSVG num={4} /></div>
                <div className="cube__face cube__face--5"><DiceFaceSVG num={5} /></div>
                <div className="cube__face cube__face--6"><DiceFaceSVG num={6} /></div>
            </div>
        </div>
    );
};
