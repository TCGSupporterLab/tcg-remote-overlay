import React from 'react';
import '../animations.css';
import { Sun, Moon } from 'lucide-react';

interface ThreeDCoinProps {
    value: '表' | '裏';
    flipping: boolean;
}

export const ThreeDCoin: React.FC<ThreeDCoinProps> = ({ value, flipping }) => {
    return (
        <div className="scene-3d" style={{ width: '140px', height: '140px' }}>
            <div className={`coin w-full h-full relative ${flipping ? 'animate-flipping' : (value === '表' ? 'show-heads' : 'show-tails')}`}
                style={{ transformStyle: 'preserve-3d' }}>

                {/* HEADS (Gold/Sun) */}
                <div className="coin__face coin__face--heads">
                    <Sun size={80} strokeWidth={1.5} className="text-yellow-900 drop-shadow-md opacity-80" />
                </div>

                {/* TAILS (Silver/Moon) */}
                <div className="coin__face coin__face--tails" style={{ transform: 'rotateY(180deg)' }}>
                    <Moon size={80} strokeWidth={1.5} className="text-gray-700 drop-shadow-md opacity-80" />
                </div>
            </div>
        </div>
    );
};
