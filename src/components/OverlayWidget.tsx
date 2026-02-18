import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Move, Maximize2, RotateCw } from 'lucide-react';

interface WidgetState {
    px: number; // Position X as fraction of window (-0.5 to 0.5)
    py: number; // Position Y as fraction of window (-0.5 to 0.5)
    scale: number;
    rotation: number; // Rotation in degrees
}

interface OverlayWidgetProps {
    children: React.ReactNode;
    gameMode: string;
}

export const OverlayWidget: React.FC<OverlayWidgetProps> = ({ children, gameMode }) => {
    // Persistent state
    const [state, setState] = useState<WidgetState>(() => {
        const saved = localStorage.getItem(`overlay_widget_v4_${gameMode}`);
        return saved ? JSON.parse(saved) : { px: 0, py: 0, scale: 1, rotation: 0 };
    });

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [isWindowResizing, setIsWindowResizing] = useState(false);

    // Store window size for mouse event calculations
    const [winSize, setWinSize] = useState({ w: window.innerWidth, h: window.innerHeight });

    const dragStartRef = useRef({ x: 0, y: 0, initialPx: 0, initialPy: 0 });
    const resizeStartRef = useRef({ x: 0, initialScale: 1 });
    const rotateStartRef = useRef({ initialRotation: 0, centerX: 0, centerY: 0, startAngle: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Save state ONLY when not manipulating to avoid lag
    useEffect(() => {
        if (isDragging || isResizing || isRotating) return;

        localStorage.setItem(`overlay_widget_v4_${gameMode}`, JSON.stringify(state));

        const channel = new BroadcastChannel('remote_duel_sync');
        channel.postMessage({ type: 'WIDGET_STATE_UPDATE', value: { gameMode, state } });
        channel.close();
    }, [state, gameMode, isDragging, isResizing, isRotating]);

    // Handle Window Resize
    useEffect(() => {
        let resizeTimeout: any;
        const handleResize = () => {
            setIsWindowResizing(true);
            setWinSize({ w: window.innerWidth, h: window.innerHeight });

            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                setIsWindowResizing(false);
            }, 150);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Listen for sync
    useEffect(() => {
        const channel = new BroadcastChannel('remote_duel_sync');
        channel.onmessage = (event) => {
            if (event.data.type === 'WIDGET_STATE_UPDATE' && event.data.value.gameMode === gameMode) {
                if (!isDragging && !isResizing && !isRotating) {
                    setState(event.data.value.state);
                }
            }
            if (event.data.type === 'RESET') {
                setState({ px: 0, py: 0, scale: 1, rotation: 0 });
            }
        };
        return () => channel.close();
    }, [gameMode, isDragging, isResizing, isRotating]);

    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            initialPx: state.px,
            initialPy: state.py
        };
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeStartRef.current = {
            x: e.clientX,
            initialScale: state.scale
        };
    };

    const handleRotateStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);

        setIsRotating(true);
        rotateStartRef.current = {
            initialRotation: state.rotation,
            centerX,
            centerY,
            startAngle: angle * (180 / Math.PI)
        };
    };

    useEffect(() => {
        if (!isDragging && !isResizing && !isRotating) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                const dPx = dx / winSize.w;
                const dPy = dy / winSize.h;
                setState(prev => ({
                    ...prev,
                    px: Math.min(Math.max(dragStartRef.current.initialPx + dPx, -0.5), 0.5),
                    py: Math.min(Math.max(dragStartRef.current.initialPy + dPy, -0.5), 0.5)
                }));
            } else if (isResizing) {
                const dx = e.clientX - resizeStartRef.current.x;
                const newScale = resizeStartRef.current.initialScale + (dx / 200);
                setState(prev => ({
                    ...prev,
                    scale: Math.min(Math.max(newScale, 0.3), 3)
                }));
            } else if (isRotating) {
                const { centerX, centerY, startAngle, initialRotation } = rotateStartRef.current;
                const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
                let diff = currentAngle - startAngle;

                let newRotation = (initialRotation + diff) % 360;
                if (newRotation < 0) newRotation += 360;

                // Snapping logic: snap to 0, 90, 180, 270 within 10 degree threshold
                const snapPoints = [0, 90, 180, 270, 360];
                const threshold = 10;
                for (const point of snapPoints) {
                    if (Math.abs(newRotation - point) < threshold) {
                        newRotation = point % 360;
                        break;
                    }
                }

                setState(prev => ({ ...prev, rotation: newRotation }));
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            setIsRotating(false);
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, isRotating, winSize]);

    const REFERENCE_HEIGHT = 720;
    const finalScale = useMemo(() => state.scale * (winSize.h / REFERENCE_HEIGHT), [state.scale, winSize.h]);
    const shouldDisableTransition = isDragging || isResizing || isRotating || isWindowResizing;

    return (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div
                ref={containerRef}
                className="pointer-events-auto relative group will-change-transform"
                style={{
                    transform: `translate3d(${state.px * 100}vw, ${state.py * 100}vh, 0) scale(${finalScale}) rotate(${state.rotation}deg)`,
                    zIndex: 100,
                    transition: shouldDisableTransition ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s'
                }}
            >
                {/* Main Content */}
                <div className="relative">
                    {children}
                </div>

                {/* Floating Handles (Bottom-Right) */}
                <div
                    className="absolute flex items-center gap-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity z-50"
                    style={{
                        bottom: `${-45 / finalScale}px`,
                        right: '0px',
                        transform: `scale(${1 / finalScale})`,
                        transformOrigin: 'bottom right',
                        transition: shouldDisableTransition ? 'none' : 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
                    }}
                >
                    {/* Move Handle */}
                    <div
                        onMouseDown={handleDragStart}
                        className="bg-blue-600/80 hover:bg-blue-500 p-2 rounded-full shadow-md cursor-grab active:cursor-grabbing text-white transition-transform hover:scale-110"
                        title="ドラッグで移動"
                    >
                        <Move size={17} />
                    </div>

                    {/* Rotate Handle */}
                    <div
                        onMouseDown={handleRotateStart}
                        className="bg-blue-600/80 hover:bg-blue-500 p-2 rounded-full shadow-md cursor-alias text-white transition-transform hover:scale-110"
                        title="ドラッグで回転"
                    >
                        <RotateCw size={17} />
                    </div>

                    {/* Resize Handle */}
                    <div
                        onMouseDown={handleResizeStart}
                        className="bg-blue-600/80 hover:bg-blue-500 p-2 rounded-full shadow-md cursor-nwse-resize text-white transition-transform hover:scale-110"
                        title="ドラッグで拡大縮小"
                    >
                        <Maximize2 size={17} className="rotate-90" />
                    </div>
                </div>
            </div>
        </div>
    );
};
