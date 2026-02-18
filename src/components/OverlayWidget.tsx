import React, { useState, useEffect, useRef } from 'react';
import { Move, Maximize2 } from 'lucide-react';

interface WidgetState {
    x: number;
    y: number;
    scale: number;
}

interface OverlayWidgetProps {
    children: React.ReactNode;
    gameMode: string;
}

export const OverlayWidget: React.FC<OverlayWidgetProps> = ({ children, gameMode }) => {
    const [state, setState] = useState<WidgetState>(() => {
        const saved = localStorage.getItem(`overlay_widget_v2_${gameMode}`);
        return saved ? JSON.parse(saved) : { x: 0, y: 0, scale: 1 };
    });

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
    const resizeStartRef = useRef({ x: 0, initialScale: 1 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Save state
    useEffect(() => {
        localStorage.setItem(`overlay_widget_v2_${gameMode}`, JSON.stringify(state));

        const channel = new BroadcastChannel('remote_duel_sync');
        channel.postMessage({ type: 'WIDGET_STATE_UPDATE', value: { gameMode, state } });
        channel.close();
    }, [state, gameMode]);

    // Listen for sync
    useEffect(() => {
        const channel = new BroadcastChannel('remote_duel_sync');
        channel.onmessage = (event) => {
            if (event.data.type === 'WIDGET_STATE_UPDATE' && event.data.value.gameMode === gameMode) {
                setState(event.data.value.state);
            }
            if (event.data.type === 'RESET') {
                setState({ x: 0, y: 0, scale: 1 });
            }
        };
        return () => channel.close();
    }, [gameMode]);

    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            initialX: state.x,
            initialY: state.y
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

    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                setState(prev => ({
                    ...prev,
                    x: dragStartRef.current.initialX + dx,
                    y: dragStartRef.current.initialY + dy
                }));
            } else if (isResizing) {
                const dx = e.clientX - resizeStartRef.current.x;
                // Sensible scaling logic: moving mouse right/down increases scale
                const newScale = resizeStartRef.current.initialScale + (dx / 200);
                setState(prev => ({
                    ...prev,
                    scale: Math.min(Math.max(newScale, 0.3), 3)
                }));
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing]);

    return (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div
                ref={containerRef}
                className="pointer-events-auto relative group"
                style={{
                    transform: `translate(${state.x}px, ${state.y}px) scale(${state.scale})`,
                    zIndex: 100
                }}
            >
                {/* Main Content */}
                <div className="relative">
                    {children}
                </div>

                {/* Bottom Controls Area (Move and Resize) */}
                <div className="absolute -bottom-12 left-0 right-0 flex justify-center items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4 pointer-events-auto">
                        {/* Move Handle (Center) */}
                        <div
                            onMouseDown={handleDragStart}
                            className="bg-blue-600 hover:bg-blue-500 p-2 rounded-full shadow-lg cursor-grab active:cursor-grabbing text-white transition-transform hover:scale-110"
                            title="ドラッグで移動"
                        >
                            <Move size={20} />
                        </div>

                        {/* Resize Handle (Right) */}
                        <div
                            onMouseDown={handleResizeStart}
                            className="bg-blue-600 hover:bg-blue-500 p-2 rounded-full shadow-lg cursor-nwse-resize text-white transition-transform hover:scale-110"
                            title="ドラッグで拡大縮小"
                        >
                            <Maximize2 size={20} className="rotate-90" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
