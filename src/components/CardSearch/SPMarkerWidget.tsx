import React from 'react';

interface SPMarkerWidgetProps {
    face: 'front' | 'back';
    onToggle: () => void;
    isFollowMode?: boolean;
}

export const SPMarkerWidget: React.FC<SPMarkerWidgetProps> = ({ face, onToggle, isFollowMode }) => {
    const base = import.meta.env.BASE_URL;
    const frontPath = `${base}images/utility/sp_marker_front.png`.replace(/\/+/g, '/');
    const backPath = `${base}images/utility/sp_marker_back.png`.replace(/\/+/g, '/');

    return (
        <div
            className={`relative cursor-pointer transition-all duration-300 ${isFollowMode ? 'w-[100px] h-[100px]' : 'w-[180px] h-[180px]'}`}
            onClick={(e) => {
                e.stopPropagation();
                onToggle();
            }}
            style={{
                perspective: '1000px',
            }}
        >
            <div
                className="relative w-full h-full transition-transform duration-500 shadow-2xl rounded-full"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: face === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* Front Side */}
                <div
                    className="absolute inset-0 w-full h-full backface-hidden rounded-full overflow-hidden"
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
                    className="absolute inset-0 w-full h-full rounded-full overflow-hidden"
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
