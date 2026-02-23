import React from 'react';
import '../animations.css';
import { Sun, Moon } from 'lucide-react';

interface ThreeDCoinProps {
    value: '表' | '裏';
    flipping: boolean;
}

export const ThreeDCoin: React.FC<ThreeDCoinProps> = ({ value, flipping }) => {
    return (
        <div className="scene-3d pointer-events-none" style={{ width: '100%', height: '100%' }}>
            <div className={`coin relative ${flipping ? 'animate-flipping' : (value === '表' ? 'show-heads' : 'show-tails')}`}
                style={{ transformStyle: 'preserve-3d' }}>

                {/* HEADS (Gold/Sun) */}
                <div className="coin__face coin__face--heads">
                    <Sun size={60} strokeWidth={1.5} className="text-yellow-900 drop-shadow-md opacity-80" />
                </div>

                {/* TAILS (Silver/Moon) */}
                <div className="coin__face coin__face--tails">
                    <Moon size={60} strokeWidth={1.5} className="text-gray-700 drop-shadow-md opacity-80" />
                </div>
            </div>
        </div>
    );
};
