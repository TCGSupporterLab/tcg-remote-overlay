import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Move, Maximize2, RotateCw, Undo2 } from 'lucide-react';
import type { WidgetState, WidgetId } from '../types/widgetTypes';

interface OverlayWidgetProps {
    children: React.ReactNode;
    gameMode: string;
    // Group & Selection props (optional for backward compat)
    instanceId?: WidgetId;
    groupId?: string;
    isSelected?: boolean;
    isGrouped?: boolean;
    onSelect?: (id: string, ctrlKey: boolean) => void;
    onStateChange?: (id: WidgetId, newState: WidgetState) => void;
    /** Ref callback to register this widget's container element for rect selection */
    containerRefCallback?: (id: WidgetId, el: HTMLDivElement | null) => void;
    /** Externally controlled state (for group member sync) */
    externalState?: WidgetState;
    /** Whether this widget is part of a larger active selection (multiple items) */
    isPartOfMultiSelection?: boolean;
}

export const OverlayWidget: React.FC<OverlayWidgetProps> = ({
    children,
    gameMode,
    instanceId,
    groupId,
    isSelected = false,
    isGrouped = false,
    onSelect,
    onStateChange,
    containerRefCallback,
    externalState,
    isPartOfMultiSelection = false,
}) => {
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

    const lastUpdateSourceRef = useRef<'local' | 'external' | 'sync'>('local');

    // Save state ONLY when not manipulating to avoid lag
    useEffect(() => {
        if (isDragging || isResizing || isRotating) return;

        // Don't broadcast if this update came from external/sync to prevent infinite loops
        if (lastUpdateSourceRef.current !== 'local') {
            lastUpdateSourceRef.current = 'local';
            return;
        }

        localStorage.setItem(`overlay_widget_v4_${gameMode}`, JSON.stringify(state));

        const channel = new BroadcastChannel('tcg_remote_sync');
        // Retrieve TAB_ID from window or use a fallback. App.tsx should set window.TAB_ID.
        const senderId = (window as any).TAB_ID || 'widget-local';
        channel.postMessage({ type: 'WIDGET_STATE_UPDATE', value: { gameMode, state }, senderId });
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
        const channel = new BroadcastChannel('tcg_remote_sync');
        channel.onmessage = (event) => {
            if (event.data.type === 'WIDGET_STATE_UPDATE' && event.data.value.gameMode === gameMode) {
                // Ignore messages sent by our own tab to avoid double-processing
                if (event.data.senderId === (window as any).TAB_ID) return;

                if (!isDragging && !isResizing && !isRotating) {
                    const newState = event.data.value.state;
                    // Only update if actually different to prevent cycles
                    if (Math.abs(newState.px - state.px) > 0.0001 ||
                        Math.abs(newState.py - state.py) > 0.0001 ||
                        Math.abs(newState.rotation - state.rotation) > 0.01 ||
                        Math.abs(newState.scale - state.scale) > 0.001) {
                        lastUpdateSourceRef.current = 'sync';
                        setState(newState);
                    }
                }
            }

            if (event.data.type === 'RESET') {
                lastUpdateSourceRef.current = 'local';
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
            // Notify parent of final state for group sync
            if (onStateChange && (instanceId || gameMode)) {
                setState(current => {
                    onStateChange(instanceId || gameMode, current);
                    return current;
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, isRotating, winSize]);

    const [isSyncing, setIsSyncing] = useState(false);
    const syncTimeoutRef = useRef<any>(null);

    const finalScale = state.scale;
    const shouldDisableTransition = isDragging || isResizing || isRotating || isWindowResizing || isSyncing;

    const [clampedOffset, setClampedOffset] = useState({ x: 0, y: 0 });
    const [yOffset, setYOffset] = useState(60);
    const handleBarRef = useRef<HTMLDivElement>(null);

    // Solution 2 & 3: Anti-rotation and Viewport Clamping
    useLayoutEffect(() => {
        if (!containerRef.current || !handleBarRef.current) return;

        // 1. Calculate dynamic Y offset based on rotated bounding box
        const contentRect = containerRef.current.getBoundingClientRect();
        const nextYOffset = (contentRect.height / 2) + 40;
        if (Math.abs(nextYOffset - yOffset) > 1) {
            setYOffset(nextYOffset);
        }

        // 2. Calculate ideal handle position without clamping
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        // The base container is at the center of the screen, translated by state.px/py.
        const idealX = (viewportW / 2) + (state.px * viewportW);
        const idealY = (viewportH / 2) + (state.py * viewportH) + yOffset;

        // We need to know the handle bar's width/height to clamp its edges
        const handleWidth = handleBarRef.current.offsetWidth;
        const handleHeight = handleBarRef.current.offsetHeight;
        const margin = 12;

        // Calculate clamped position
        const minX = margin + handleWidth / 2;
        const maxX = viewportW - margin - handleWidth / 2;
        const minY = margin + handleHeight / 2;
        const maxY = viewportH - margin - handleHeight / 2;

        const clampedX = Math.min(Math.max(idealX, minX), maxX);
        const clampedY = Math.min(Math.max(idealY, minY), maxY);

        // Required offset is the difference between clamped and ideal
        const dx = clampedX - idealX;
        const dy = clampedY - idealY;

        if (Math.abs(dx - clampedOffset.x) > 0.5 || Math.abs(dy - clampedOffset.y) > 0.5) {
            setClampedOffset({ x: dx, y: dy });
        }
    }, [state, winSize, finalScale, yOffset, clampedOffset.x, clampedOffset.y]);

    // Determine if handles should be shown (hidden for ALL grouped widgets or multi-selected items)
    const showHandles = !isGrouped && !isPartOfMultiSelection;

    // Handle click on widget content for selection (Ctrl+Click only)
    const handleContentClick = (e: React.MouseEvent) => {
        const isMultiSelect = e.ctrlKey || e.metaKey;
        if (!isMultiSelect) return;
        e.preventDefault();
        e.stopPropagation();
        if (onSelect) {
            // Grouped widgets: select the group, not the individual widget
            if (isGrouped && groupId) {
                onSelect(groupId, true);
            } else if (instanceId || gameMode) {
                onSelect(instanceId || gameMode, true);
            }
        }
    };

    // Sync with external state (e.g. group member position update)
    useEffect(() => {
        if (externalState) {
            // Only update if actually different
            if (Math.abs(externalState.px - state.px) > 0.00001 ||
                Math.abs(externalState.py - state.py) > 0.00001 ||
                Math.abs(externalState.rotation - state.rotation) > 0.001 ||
                Math.abs(externalState.scale - state.scale) > 0.001) {
                lastUpdateSourceRef.current = 'external';
                setState(externalState);
            }
            setIsSyncing(true);
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = setTimeout(() => setIsSyncing(false), 150);
        }
    }, [externalState]);


    // Register container ref for rect selection
    useEffect(() => {
        if (containerRefCallback && (instanceId || gameMode)) {
            containerRefCallback(instanceId || gameMode, containerRef.current);
            return () => containerRefCallback(instanceId || gameMode, null);
        }
    }, [containerRefCallback, instanceId, gameMode]);

    return (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            {/* Translation Base (Center of Widget) */}
            <div
                className="absolute group"
                style={{
                    transform: `translate3d(${state.px * 100}vw, ${state.py * 100}vh, 0)`,
                    zIndex: 100,
                    transition: shouldDisableTransition ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
                }}
            >
                {/* A. Rotated & Scaled Content (The card/panel) */}
                <div
                    ref={containerRef}
                    className="pointer-events-auto relative"
                    style={{
                        transform: `scale(${finalScale}) rotate(${state.rotation}deg)`,
                        transition: shouldDisableTransition ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
                    }}
                    onClickCapture={handleContentClick}
                >
                    {children}
                    {/* Selection highlight (not shown for grouped widgets - group has its own frame) */}
                    {isSelected && !isGrouped && (
                        <div
                            className="absolute inset-[-4px] border-2 border-blue-400 rounded-lg pointer-events-none"
                            style={{ boxShadow: '0 0 12px rgba(96, 165, 250, 0.4)' }}
                        />
                    )}
                </div>

                {/* B. Floating Handles (Stays Upright & Clamped) */}
                {showHandles && (
                    <div
                        ref={handleBarRef}
                        className="absolute pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap flex items-center gap-2"
                        style={{
                            left: '50%',
                            top: '50%',
                            // yOffset moves it to bottom, clampedOffset keeps it in screen.
                            // No rotation applied here = Always upright.
                            transform: `translate(-50%, -50%) translate(${clampedOffset.x}px, ${yOffset + clampedOffset.y}px)`,
                            transition: shouldDisableTransition ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s'
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

                        {/* Reset Handle */}
                        <div
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setState({ px: 0, py: 0, scale: 1, rotation: 0 });
                            }}
                            className="bg-red-600/80 hover:bg-red-500 p-2 rounded-full shadow-md cursor-pointer text-white transition-transform hover:scale-110 ml-2"
                            title="初期状態にリセット"
                        >
                            <Undo2 size={17} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
