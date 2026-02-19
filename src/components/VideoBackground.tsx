import React, { useEffect, useRef, useState, useCallback } from 'react';

export type VideoSourceType = 'none' | 'camera' | 'screen';

export interface CropConfig {
    x: number;      // translate X (%)
    y: number;      // translate Y (%)
    scale: number;  // zoom (1.0 to 5.0)
    top: number;    // crop top (%)
    bottom: number; // crop bottom (%)
    left: number;   // crop left (%)
    right: number;  // crop right (%)
}

interface VideoBackgroundProps {
    sourceType: VideoSourceType;
    flipMode?: 'none' | 'horizontal' | 'vertical' | 'both';
    cropConfig?: CropConfig;
    className?: string;
    onCropChange?: (config: CropConfig) => void;
    onReset?: () => void;
    onClose?: () => void;
    isAdjustmentMode?: boolean;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
    sourceType,
    flipMode = 'none',
    cropConfig = { x: 0, y: 0, scale: 1, top: 0, bottom: 0, left: 0, right: 0 },
    className = '',
    onCropChange,
    onReset,
    onClose,
    isAdjustmentMode = false
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, cropX: 0, cropY: 0 });

    const stopStream = () => {
        setIsActive(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const startStream = async () => {
        setError(null);
        if (sourceType === 'none') {
            stopStream();
            return;
        }

        try {
            let stream: MediaStream;
            if (sourceType === 'camera') {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { min: 1280, ideal: 1920, max: 3840 },
                        height: { min: 720, ideal: 1080, max: 2160 },
                        frameRate: { ideal: 30 }
                    },
                    audio: false
                });
            } else {
                // @ts-ignore
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false
                });
            }

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsActive(true);
        } catch (err: any) {
            console.error('Error accessing media devices:', err);
            setError(err.name === 'NotAllowedError' ? 'カメラの使用許可が必要です' : '映像を取得できませんでした');
            setIsActive(false);
        }
    };

    useEffect(() => {
        startStream();
        return () => stopStream();
    }, [sourceType]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isAdjustmentMode) return;
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            cropX: cropConfig.x,
            cropY: cropConfig.y
        };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !onCropChange) return;

        const dx = (e.clientX - dragStartRef.current.x) / window.innerWidth * 100;
        const dy = (e.clientY - dragStartRef.current.y) / window.innerHeight * 100;

        onCropChange({
            ...cropConfig,
            x: dragStartRef.current.cropX + dx,
            y: dragStartRef.current.cropY + dy
        });
    }, [isDragging, cropConfig, onCropChange]);

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!isAdjustmentMode || !onCropChange) return;

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(1, Math.min(5, cropConfig.scale + delta));

        onCropChange({
            ...cropConfig,
            scale: newScale
        });
    };

    const handleCropEdge = (edge: 'top' | 'bottom' | 'left' | 'right', value: number) => {
        if (!onCropChange) return;
        onCropChange({
            ...cropConfig,
            [edge]: value
        });
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove]);

    // Global middle-click listener
    useEffect(() => {
        const handleGlobalMouseDown = (e: MouseEvent) => {
            if (e.button === 1 && onClose) { // Middle click
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('mousedown', handleGlobalMouseDown);
        return () => window.removeEventListener('mousedown', handleGlobalMouseDown);
    }, [onClose]);

    if (sourceType === 'none') return null;

    const getFinalTransform = () => {
        let flipStr = '';
        switch (flipMode) {
            case 'horizontal': flipStr = 'scaleX(-1)'; break;
            case 'vertical': flipStr = 'scaleY(-1)'; break;
            case 'both': flipStr = 'scale(-1, -1)'; break;
        }

        const cropStr = `scale(${cropConfig.scale}) translate(${cropConfig.x / cropConfig.scale}%, ${cropConfig.y / cropConfig.scale}%)`;

        return `${flipStr} ${cropStr}`.trim();
    };

    // Use clip-path for edge trimming
    const clipPath = `inset(${cropConfig.top}% ${cropConfig.right}% ${cropConfig.bottom}% ${cropConfig.left}%)`;

    return (
        <>
            {/* Background Video Layer */}
            <div
                className={`fixed inset-0 overflow-hidden bg-black ${className}`}
                style={{ zIndex: -1 }}
                onMouseDown={() => {
                    // Handled by global listener
                }}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: getFinalTransform(),
                        clipPath: clipPath,
                        opacity: isActive ? 1 : 0,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out, clip-path 0.1s ease-out'
                    }}
                />
            </div>

            {/* Interaction Layer (Only visible during adjustment) */}
            {isAdjustmentMode && (
                <div
                    className="fixed inset-0 z-[100] cursor-move select-none"
                    onMouseDown={(e) => {
                        if (e.button === 1) return; // Handled by global listener
                        handleMouseDown(e);
                    }}
                    onWheel={handleWheel}
                >
                    {/* Visual Guide Overlay */}
                    <div className="absolute inset-0 border-4 border-blue-500/50 pointer-events-none animate-pulse" />

                    {/* Control Panel */}
                    <div
                        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center bg-blue-600 text-white p-4 rounded-full text-base font-bold shadow-2xl pointer-events-auto min-w-[800px]"
                        onWheel={(e) => e.stopPropagation()}
                    >
                        {/* Left Margin Spacer */}
                        <div className="w-32" />

                        <span>ビデオ調整中 (ドラッグ:移動 / ホイール:ズーム)</span>

                        {/* Middle Spacer to push buttons to the right */}
                        <div className="flex-1" />

                        <div
                            className="flex gap-2 mr-4"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            {onReset && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onReset(); }}
                                    className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg text-xs transition-all border border-white/10 active:scale-95 whitespace-nowrap"
                                >
                                    リセット
                                </button>
                            )}
                            {onClose && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                                    className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg text-xs transition-all border border-white/10 active:scale-95 whitespace-nowrap"
                                >
                                    終了
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Edge Crop Sliders */}
                    <div
                        className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 bg-black/60 p-4 rounded-xl border border-white/20 pointer-events-auto"
                        onMouseDown={(e) => e.stopPropagation()}
                        onWheel={(e) => e.stopPropagation()}
                    >
                        <div className="text-[10px] text-white/60 mb-1 uppercase font-bold tracking-wider">Trimming</div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] text-white">Top: {cropConfig.top}%</label>
                            <input type="range" min="0" max="50" value={cropConfig.top} onChange={(e) => handleCropEdge('top', Number(e.target.value))} className="w-24 h-1 appearance-none bg-white/20 rounded-full" />

                            <label className="text-[10px] text-white">Bot: {cropConfig.bottom}%</label>
                            <input type="range" min="0" max="50" value={cropConfig.bottom} onChange={(e) => handleCropEdge('bottom', Number(e.target.value))} className="w-24 h-1 appearance-none bg-white/20 rounded-full" />

                            <label className="text-[10px] text-white">Left: {cropConfig.left}%</label>
                            <input type="range" min="0" max="50" value={cropConfig.left} onChange={(e) => handleCropEdge('left', Number(e.target.value))} className="w-24 h-1 appearance-none bg-white/20 rounded-full" />

                            <label className="text-[10px] text-white">Right: {cropConfig.right}%</label>
                            <input type="range" min="0" max="50" value={cropConfig.right} onChange={(e) => handleCropEdge('right', Number(e.target.value))} className="w-24 h-1 appearance-none bg-white/20 rounded-full" />
                        </div>
                    </div>
                </div>
            )}

            {!isActive && (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 pointer-events-auto z-10 p-6 text-center">
                    <p className="text-white mb-4 text-sm font-medium">
                        {error || (sourceType === 'camera' ? 'カメラ映像を表示します' : '画面共有を開始します')}
                    </p>
                    <button
                        onClick={startStream}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                    >
                        {sourceType === 'camera' ? 'カメラを起動' : '画面共有を開始'}
                    </button>
                </div>
            )}
        </>
    );
};
