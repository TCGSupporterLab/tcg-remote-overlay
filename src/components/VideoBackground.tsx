import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize, Minimize } from 'lucide-react';

export type VideoSourceType = 'none' | 'camera' | 'screen';

export interface CropConfig {
    x: number;      // translate X (%)
    y: number;      // translate Y (%)
    scale: number;  // zoom (1.0 to 5.0)
    top: number;    // crop top (%)
    bottom: number; // crop bottom (%)
    left: number;   // crop left (%)
    right: number;  // crop right (%)
    rotation: number; // 0, 90, 180, 270
    flipH: boolean;
    flipV: boolean;
}

interface VideoBackgroundProps {
    sourceType: VideoSourceType;
    cropConfig?: CropConfig;
    className?: string;
    onCropChange?: (config: CropConfig) => void;
    onReset?: () => void;
    onClose?: () => void;
    isAdjustmentMode?: boolean;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
    sourceType,
    cropConfig = { x: 0, y: 0, scale: 1, top: 0, bottom: 0, left: 0, right: 0, rotation: 0, flipH: false, flipV: false },
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
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

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
        // Stop any active stream when the source type changes or is set to none
        stopStream();

        // Do NOT auto-call startStream(). 
        // Browsers require a user gesture for getDisplayMedia, 
        // and we want to avoid multiple/unwanted dialogs when syncing state.
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
        // The video element is already covering the full div with object-fit: cover.
        // We apply scale, translate, rotate, and flip directly to it.
        let transform = `scale(${cropConfig.scale}) translate(${cropConfig.x / cropConfig.scale}%, ${cropConfig.y / cropConfig.scale}%)`;
        transform += ` rotate(${cropConfig.rotation}deg)`;

        if (cropConfig.flipH) transform += ' scaleX(-1)';
        if (cropConfig.flipV) transform += ' scaleY(-1)';

        return transform;
    };

    const handleRotate = (delta: number) => {
        if (!onCropChange) return;
        let nextRotation = (cropConfig.rotation + delta) % 360;
        if (nextRotation < 0) nextRotation += 360;

        // Swap values so the trim follows the content's orientation
        let { top, right, bottom, left } = cropConfig;
        if (delta === 90 || delta === -270) {
            [top, right, bottom, left] = [left, top, right, bottom];
        } else if (delta === -90 || delta === 270) {
            [top, right, bottom, left] = [right, bottom, left, top];
        } else if (Math.abs(delta) === 180) {
            [top, right, bottom, left] = [bottom, left, top, right];
        }

        onCropChange({ ...cropConfig, rotation: nextRotation, top, right, bottom, left });
    };

    const toggleFlip = (axis: 'H' | 'V') => {
        if (!onCropChange) return;
        const { flipH, flipV, top, right, bottom, left } = cropConfig;
        if (axis === 'H') {
            onCropChange({ ...cropConfig, flipH: !flipH, left: right, right: left });
        } else {
            onCropChange({ ...cropConfig, flipV: !flipV, top: bottom, bottom: top });
        }
    };

    // Calculate physical inset mapping so sliders always control visual directions (Top slider = Visual Top)
    const getPhysicalInset = () => {
        let { top: vT, right: vR, bottom: vB, left: vL } = cropConfig;

        // 1. Un-flip (Inverse of scaleX/scaleY applied AFTER rotate in CSS)
        // If visually flipped, the 'visual top' slider value actually belongs to the 'physical bottom' edge, etc.
        if (cropConfig.flipV) [vT, vB] = [vB, vT];
        if (cropConfig.flipH) [vL, vR] = [vR, vL];

        // 2. Un-rotate (Inverse of rotate applied BEFORE flip in CSS)
        const r = ((cropConfig.rotation % 360) + 360) % 360;

        // Map visual directions to physical edges
        let pT, pR, pB, pL;
        if (r === 90) {
            // Clockwise 90: Visual Top is Physical Left, Visual Right is Physical Top...
            [pT, pR, pB, pL] = [vR, vB, vL, vT];
        } else if (r === 180) {
            [pT, pR, pB, pL] = [vB, vL, vT, vR];
        } else if (r === 270) {
            [pT, pR, pB, pL] = [vL, vT, vR, vB];
        } else {
            [pT, pR, pB, pL] = [vT, vR, vB, vL];
        }

        return `inset(${pT}% ${pR}% ${pB}% ${pL}%)`;
    };

    const clipPath = getPhysicalInset();

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
                <>
                    {/* 1. Full Screen Drag & Interaction Layer */}
                    <div
                        className="fixed inset-0 z-[400] cursor-move select-none pointer-events-auto"
                        onMouseDown={handleMouseDown}
                        onWheel={handleWheel}
                    >
                        {/* Strong guide waku with thicker stroke */}
                        {/* Strong guide waku set to 8px as requested */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ outline: '8px solid rgba(255, 0, 0, 0.6)', outlineOffset: '-8px' }}
                        />
                    </div>

                    {/* 2. Top Banner (Fixed) - Solid Frame with Maximum Spacing */}
                    <div
                        className="fixed top-10 left-1/2 -translate-x-1/2 z-[500] pointer-events-auto"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="bg-[#0f172a] text-white pl-5 pr-[25px] py-5 rounded-none flex items-center justify-between w-[640px] border border-[#ff0000] shadow-[0_0_50px_rgba(255,0,0,0.2)]">
                            {/* Left Side: Status */}
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 bg-[#ff0000] shadow-[0_0_10px_rgba(255,0,0,0.8)] animate-pulse" />
                                <span className="font-black text-lg tracking-tight text-[#ff0000]">ビデオ調整中</span>
                            </div>

                            {/* Right Side: Actions (Aligned with pl-5 / pr-[25px]) */}
                            <div className="flex gap-4">
                                <button
                                    onClick={toggleFullscreen}
                                    className="w-[110px] flex-shrink-0 bg-white hover:bg-white/90 py-2 rounded-none text-xs font-black text-blue-600 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                                    title={isFullscreen ? "全画面解除" : "全画面表示"}
                                >
                                    {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                                    {isFullscreen ? "縮小" : "全画面"}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onReset?.(); }}
                                    className="w-[110px] flex-shrink-0 bg-white hover:bg-white/90 py-2 rounded-none text-xs font-black text-blue-600 transition-all active:scale-95 shadow-md"
                                >
                                    リセット
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                                    className="w-[110px] flex-shrink-0 bg-white hover:bg-white/90 py-2 rounded-none text-xs font-black text-blue-600 transition-all active:scale-95 shadow-md"
                                >
                                    完了
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 3. Bottom-Left Adjustment Panel (Fixed) - Sharp and Solid */}
                    <div
                        className="fixed bottom-10 left-10 z-[500] pointer-events-auto"
                        style={{ bottom: '40px', left: '40px' }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div
                            className="p-6 rounded-none border border-blue-400/30 shadow-2xl flex flex-col gap-[26px]"
                            style={{
                                backgroundColor: 'rgba(30, 58, 138, 0.4)', // Deeper blue for solid look
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)'
                            }}
                        >
                            {/* Sharp Icon Controls */}
                            <div className="flex items-center gap-2">
                                <div className="flex bg-black/40 p-1 rounded-none gap-0.5 border border-white/5">
                                    {[
                                        { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>, delta: -90, title: "-90°" },
                                        { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>, delta: 90, title: "+90°" },
                                        {
                                            icon: (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    {/* Straight double-headed arrow */}
                                                    <path d="M2 8h20" />
                                                    <path d="m6 5-4 3 4 3" />
                                                    <path d="m18 5 4 3-4 3" />
                                                    {/* Text at the bottom */}
                                                    <text x="12" y="22" fontSize="10" fontWeight="900" fill="currentColor" stroke="none" textAnchor="middle" letterSpacing="-0.5">180°</text>
                                                </svg>
                                            ), delta: 180, title: "180°"
                                        }
                                    ].map((btn, idx) => (
                                        <button
                                            key={idx}
                                            onClick={(e) => { e.stopPropagation(); handleRotate(btn.delta); }}
                                            className="p-2.5 hover:bg-white/10 rounded-none transition-all text-white active:scale-95"
                                            title={btn.title}
                                        >
                                            {btn.icon}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex bg-black/40 p-1 rounded-none gap-0.5 border border-white/5">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFlip('H'); }}
                                        className={`p-2.5 rounded-none transition-all active:scale-95 ${cropConfig.flipH ? 'bg-blue-600 text-white' : 'text-white/60 hover:bg-white/10'}`}
                                        title="左右反転"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m5 15-3-3 3-3" />
                                            <path d="m19 9 3 3-3 3" />
                                            <path d="M2 12h20" />
                                            <path d="M12 2v20" strokeDasharray="3 3" className="opacity-40" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFlip('V'); }}
                                        className={`p-2.5 rounded-none transition-all active:scale-95 ${cropConfig.flipV ? 'bg-blue-600 text-white' : 'text-white/60 hover:bg-white/10'}`}
                                        title="上下反転"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m15 5-3-3-3 3" />
                                            <path d="m9 19 3 3 3-3" />
                                            <path d="M12 2v20" />
                                            <path d="M2 12h20" strokeDasharray="3 3" className="opacity-40" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Sharp Trimming Sliders */}
                            <div className="w-[220px] flex flex-col gap-4">
                                {[
                                    { key: 'top', label: '上端' },
                                    { key: 'bottom', label: '下端' },
                                    { key: 'left', label: '左端' },
                                    { key: 'right', label: '右端' }
                                ].map(({ key, label }) => (
                                    <div key={key} className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center px-0.5">
                                            <span className="text-white/40 text-[9px] uppercase font-black tracking-widest">{label}</span>
                                            <span className="text-blue-300 font-mono text-[10px] font-bold">{cropConfig[key as keyof CropConfig] as number}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            value={cropConfig[key as keyof CropConfig] as number}
                                            onChange={(e) => {
                                                if (onCropChange) onCropChange({ ...cropConfig, [key]: Number(e.target.value) });
                                            }}
                                            className="w-full h-1 appearance-none bg-white/10 rounded-none accent-blue-500 cursor-pointer"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {
                !isActive && (
                    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 pointer-events-auto z-50 p-6 text-center">
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
                )
            }
        </>
    );
};
