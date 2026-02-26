import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import Moveable from 'react-moveable';
import type {
    OnDrag, OnScale, OnRotate, OnRotateStart
} from 'react-moveable';

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

export const DEFAULT_CROP: CropConfig = { x: 0, y: 0, scale: 1, top: 0, bottom: 0, left: 0, right: 0, rotation: 0, flipH: false, flipV: false };

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
    cropConfig = DEFAULT_CROP,
    className = '',
    onCropChange,
    onReset,
    onClose,
    isAdjustmentMode = false
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const [isAltPressed, setIsAltPressed] = useState(false);
    const [dragMode, setDragMode] = useState<'none' | 'scale' | 'clip'>('none');

    useEffect(() => {
        if (!isAdjustmentMode) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Alt') {
                e.preventDefault();
                setIsAltPressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Alt') {
                e.preventDefault();
                setIsAltPressed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isAdjustmentMode]);

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

    const stopStream = useCallback(() => {
        setIsActive(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

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
        stopStream();
    }, [sourceType, stopStream]);

    if (sourceType === 'none') return null;

    const getFinalTransform = () => {
        let transform = `translate(${cropConfig.x}%, ${cropConfig.y}%) scale(${cropConfig.scale})`;
        transform += ` rotate(${cropConfig.rotation}deg)`;
        if (cropConfig.flipH) transform += ' scaleX(-1)';
        if (cropConfig.flipV) transform += ' scaleY(-1)';
        return transform;
    };

    const handleRotate = (delta: number) => {
        if (!onCropChange) return;
        let nextRotation = (cropConfig.rotation + delta) % 360;
        if (nextRotation < 0) nextRotation += 360;

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

    const getPhysicalInset = () => {
        let { top: vT, right: vR, bottom: vB, left: vL } = cropConfig;
        if (cropConfig.flipV) [vT, vB] = [vB, vT];
        if (cropConfig.flipH) [vL, vR] = [vR, vL];
        const r = ((cropConfig.rotation % 360) + 360) % 360;
        let pT, pR, pB, pL;
        if (r === 90) {
            [pT, pR, pB, pL] = [vL, vT, vR, vB];
        } else if (r === 180) {
            [pT, pR, pB, pL] = [vB, vL, vT, vR];
        } else if (r === 270) {
            [pT, pR, pB, pL] = [vR, vB, vL, vT];
        } else {
            [pT, pR, pB, pL] = [vT, vR, vB, vL];
        }
        return `inset(${pT}% ${pR}% ${pB}% ${pL}%)`;
    };

    const handleMoveableDragStart = (e: any) => {
        if (isAltPressed || e.inputEvent?.altKey) {
            e.stopDrag();
            return;
        }
        if (e.set) {
            e.set([cropConfig.x, cropConfig.y]);
        }
    };

    const handleMoveableDrag = (e: OnDrag) => {
        if (!onCropChange || !containerRef.current) return;
        const current = cropConfig;
        const dx = (e.beforeDelta[0] / containerRef.current.clientWidth) * 100;
        const dy = (e.beforeDelta[1] / containerRef.current.clientHeight) * 100;
        onCropChange({ ...current, x: current.x + dx, y: current.y + dy });
    };

    const handleMoveableScaleStart = (e: any) => {
        if (isAltPressed || e.inputEvent?.altKey) {
            console.log('[Moveable] Scale START CANCELLED - Alt is pressed');
            e.stopDrag();
            return;
        }
        console.log('[Moveable] Scale START');
        setDragMode('scale');
        e.set([cropConfig.scale, cropConfig.scale]);
        if (e.dragStart) {
            e.dragStart.set([cropConfig.x, cropConfig.y]);
        }
    };

    const handleMoveableScale = (e: OnScale) => {
        if (!onCropChange || !containerRef.current) return;
        const current = cropConfig;
        const dx = (e.drag.beforeDelta[0] / containerRef.current.clientWidth) * 100;
        const dy = (e.drag.beforeDelta[1] / containerRef.current.clientHeight) * 100;
        const nextScale = e.scale[0];
        const nextX = current.x + dx;
        const nextY = current.y + dy;

        console.log('[Moveable] Scale:', { scale: nextScale, nextX, nextY });

        if (videoRef.current) {
            let transform = `translate(${nextX}%, ${nextY}%) scale(${nextScale})`;
            transform += ` rotate(${current.rotation}deg)`;
            if (current.flipH) transform += ' scaleX(-1)';
            if (current.flipV) transform += ' scaleY(-1)';
            videoRef.current.style.transform = transform;
        }

        onCropChange({ ...current, scale: nextScale, x: nextX, y: nextY });
    };

    const handleMoveableRotateStart = (e: OnRotateStart) => {
        e.set(cropConfig.rotation);
        if (e.dragStart) {
            e.dragStart.set([cropConfig.x, cropConfig.y]);
        }
    };

    const handleMoveableRotate = (e: OnRotate) => {
        if (!onCropChange || !containerRef.current) return;
        const current = cropConfig;
        const dx = (e.drag.beforeDelta[0] / containerRef.current.clientWidth) * 100;
        const dy = (e.drag.beforeDelta[1] / containerRef.current.clientHeight) * 100;
        onCropChange({ ...current, rotation: e.rotate, x: current.x + dx, y: current.y + dy });
    };

    const handleMoveableClip = (e: any) => {
        const clipPathStr = e.clipStyle || e.clipPath;
        if (!onCropChange || !clipPathStr) {
            console.log('[Moveable] Clip Progress SKIPPED - Missing cropChange or clipPath', e);
            return;
        }
        console.log('[Moveable] Clip Progress:', clipPathStr);

        // Direct style update for real-time preview
        if (videoRef.current) {
            videoRef.current.style.clipPath = clipPathStr;
        }

        const match = clipPathStr.match(/inset\(\s*([\d.%px]+)\s+([\d.%px]+)\s+([\d.%px]+)\s+([\d.%px]+)\s*\)/i) ||
            clipPathStr.match(/inset\(\s*([\d.%px]+)\s*\)/i);

        if (match) {
            const values = match.slice(1).map((v: string) => parseFloat(v));
            let [pT, pR, pB, pL] = values.length === 1 ? [values[0], values[0], values[0], values[0]] : values;
            const current = cropConfig;
            const r = ((current.rotation % 360) + 360) % 360;
            let vT, vR, vB, vL;
            if (r === 90) {
                [vL, vT, vR, vB] = [pT, pR, pB, pL];
            } else if (r === 180) {
                [vB, vL, vT, vR] = [pT, pR, pB, pL];
            } else if (r === 270) {
                [vR, vB, vL, vT] = [pT, pR, pB, pL];
            } else {
                [vT, vR, vB, vL] = [pT, pR, pB, pL];
            }
            if (current.flipV) [vT, vB] = [vB, vT];
            if (current.flipH) [vL, vR] = [vR, vL];
            onCropChange({ ...current, top: vT, right: vR, bottom: vB, left: vL });
        }
    };

    const clipPath = getPhysicalInset();

    return (
        <>
            <div
                ref={containerRef}
                className={`fixed overflow-hidden bg-black ${!isAdjustmentMode ? 'transition-all' : ''} ${className} ${isAdjustmentMode ? 'shadow-[0_0_100px_rgba(0,0,0,0.8)] border-[1px] border-white/20 video-adjustment-overlay' : ''}`}
                style={{
                    zIndex: isAdjustmentMode ? 450 : -1,
                    inset: isAdjustmentMode ? '7.5vh 7.5vw' : '0',
                    width: isAdjustmentMode ? '85vw' : '100vw',
                    height: isAdjustmentMode ? '85vh' : '100vh',
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
                        transition: isAdjustmentMode ? 'none' : 'transform 0.1s ease-out, clip-path 0.1s ease-out'
                    }}
                />
            </div>

            {isAdjustmentMode && (
                <>
                    {(() => {
                        const isClipping = dragMode === 'clip' || (dragMode === 'none' && isAltPressed);
                        return (
                            <Moveable
                                target={videoRef.current}
                                container={document.body}
                                draggable={!isClipping}
                                scalable={!isClipping}
                                rotatable={!isClipping}
                                clippable={isClipping}
                                clipRelative={true}
                                clipArea={true}
                                clipTargetBounds={false}
                                dragWithClip={false}
                                keepRatio={!isClipping}
                                onDragStart={(e) => {
                                    handleMoveableDragStart(e);
                                }}
                                onDrag={handleMoveableDrag}
                                onDragEnd={() => setDragMode('none')}
                                onScaleStart={(e) => {
                                    handleMoveableScaleStart(e);
                                }}
                                onScale={handleMoveableScale}
                                onScaleEnd={() => setDragMode('none')}
                                onRotateStart={(e) => {
                                    handleMoveableRotateStart(e);
                                    setDragMode('scale');
                                }}
                                onRotate={handleMoveableRotate}
                                onRotateEnd={() => setDragMode('none')}
                                throttleRotate={0}
                                throttleDrag={0}
                                throttleScale={0}
                                snapRotationDegrees={[0, 90, 180, 270]}
                                snapRotationThreshold={5}
                                defaultClipPath={clipPath}
                                onClipStart={(e) => {
                                    console.log('[Moveable] Clip START', e);
                                    setDragMode('clip');
                                }}
                                onClip={handleMoveableClip}
                                onClipEnd={(e) => {
                                    console.log('[Moveable] Clip END', e);
                                    setDragMode('none');
                                }}
                                renderDirections={["nw", "ne", "sw", "se", "n", "s", "e", "w"]}
                                className="video-moveable"
                            />
                        );
                    })()}

                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-[500] 
                        bg-black/80 text-white px-4 py-2 rounded-full border border-white/20 text-sm">
                        {isAltPressed
                            ? "🎦 トリミングモード（端をドラッグして切り抜き）"
                            : "📐 拡大・移動モード（Altキーを押しながらトリミング）"}
                    </div>

                    {/* Guides */}
                    <div className="fixed inset-0 z-[400] select-none pointer-events-none video-adjustment-overlay">
                        <div
                            className="absolute inset-0"
                            style={{ outline: '8px solid rgba(255, 0, 0, 0.4)', outlineOffset: '-8px' }}
                        />
                    </div>

                    {/* Top Banner */}
                    <div
                        className="fixed top-10 left-1/2 -translate-x-1/2 z-[500] pointer-events-auto video-adjustment-overlay"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="bg-[#0f172a] text-white pl-5 pr-[25px] py-5 rounded-none flex items-center justify-between w-[640px] border border-[#ff0000] shadow-[0_0_50px_rgba(255,0,0,0.2)]">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 bg-[#ff0000] shadow-[0_0_10px_rgba(255,0,0,0.8)] animate-pulse" />
                                <span className="font-black text-lg tracking-tight text-[#ff0000]">ビデオ調整中</span>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={toggleFullscreen}
                                    className="w-[110px] flex-shrink-0 bg-white hover:bg-white/90 py-2 rounded-none text-xs font-black text-blue-600 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
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

                    {/* Adjustment Panel */}
                    <div
                        className="fixed bottom-10 left-10 z-[500] pointer-events-auto video-adjustment-overlay"
                        style={{ bottom: '40px', left: '40px' }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div
                            className="p-6 rounded-none border border-blue-400/30 shadow-2xl flex flex-col gap-[26px]"
                            style={{
                                backgroundColor: 'rgba(30, 58, 138, 0.4)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)'
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="flex bg-black/40 p-1 rounded-none gap-0.5 border border-white/5">
                                    {[
                                        { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>, delta: -90, title: "-90°" },
                                        { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>, delta: 90, title: "+90°" },
                                        {
                                            icon: (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M2 8h20" />
                                                    <path d="m6 5-4 3 4 3" />
                                                    <path d="m18 5 4 3-4 3" />
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
                        </div>
                    </div>
                </>
            )}

            {!isActive && (
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
            )}
        </>
    );
};
