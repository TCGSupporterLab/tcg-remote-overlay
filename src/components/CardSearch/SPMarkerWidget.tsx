import React from 'react';

interface SPMarkerWidgetProps {
    face: 'front' | 'back';
    onToggle: () => void;
}

export const SPMarkerWidget: React.FC<SPMarkerWidgetProps> = ({ face, onToggle }) => {
    // --- 【調整用】サイズの設定 ---
    // ここを書き換えるだけで、縦横比を保ったままサイズが変わります
    const INDEPENDENT_SIZE = 380; // 表示モードの大きさ
    // ----------------------------

    const size = INDEPENDENT_SIZE;
    const height = Math.round(size * ((283 + 285) / (481 + 482))); // アスペクト比を元画像の平均に合わせる

    const base = import.meta.env.BASE_URL;
    const frontPath = `${base}images/utility/sp_marker_front.png`.replace(/\/+/g, '/');
    const backPath = `${base}images/utility/sp_marker_back.png`.replace(/\/+/g, '/');

    return (
        <div
            className="relative cursor-pointer transition-all duration-300"
            onClick={(e) => {
                e.stopPropagation();
                onToggle();
            }}
            style={{
                width: `${size}px`,
                height: `${height}px`,
                perspective: '1000px',
            }}
        >
            <div
                className="relative w-full h-full transition-transform duration-500 drop-shadow-2xl"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: face === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* Front Side */}
                <div
                    className="absolute inset-0 w-full h-full backface-hidden overflow-hidden"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                    }}
                >
                    <img
                        src={frontPath}
                        alt="SP Marker Front"
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Back Side */}
                <div
                    className="absolute inset-0 w-full h-full overflow-hidden"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    <img
                        src={backPath}
                        alt="SP Marker Back"
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
        </div>
    );
};
