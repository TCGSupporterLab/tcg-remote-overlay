import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Move, Maximize2, RotateCw, Undo2, Unlink, Link } from 'lucide-react';
import type { WidgetId, WidgetState } from '../types/widgetTypes';

interface GroupBoundingBoxProps {
    groupId: string;
    memberIds: WidgetId[];
    anchorId: WidgetId;
    isSelected: boolean;
    widgetRefsMap: React.RefObject<Map<WidgetId, HTMLDivElement>>;
    onAnchorStateChange: (anchorId: WidgetId, newState: WidgetState, memberIds: WidgetId[]) => void;
    onManipulationStart?: () => void;
    onManipulationEnd?: () => void;
    onUngroup?: (groupId: string) => void;
    onGroup?: (memberIds: WidgetId[]) => void;
    externalAnchorState?: WidgetState;
    isDeactivated?: boolean;
    isGlobalManipulating?: boolean;
    onReset?: (groupId: string) => void;
}



export const GroupBoundingBox: React.FC<GroupBoundingBoxProps> = ({
    groupId,
    memberIds,
    anchorId,
    isSelected,
    widgetRefsMap,
    onAnchorStateChange,
    onManipulationStart,
    onManipulationEnd,
    onUngroup,
    onGroup,
    externalAnchorState,
    isDeactivated = false,
    isGlobalManipulating = false,
    onReset
}) => {


    const [bbox, setBbox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [visualRotateAngle, setVisualRotateAngle] = useState(0);
    const [clampedOffset, setClampedOffset] = useState({ x: 0, y: 0 });

    const mouseRef = useRef({ x: 0, y: 0 });
    const manipRef = useRef<{
        mouseX: number;
        mouseY: number;
        initialState: WidgetState;
        rotateCenter: { x: number; y: number };
        rotateCenterNormalized: { x: number; y: number };
        rotateStartAngle: number;
        initialBbox: { x: number; y: number; w: number; h: number } | null;
    }>({
        mouseX: 0,
        mouseY: 0,
        initialState: { px: 0, py: 0, scale: 1, rotation: 0 },
        rotateCenter: { x: 0, y: 0 },
        rotateCenterNormalized: { x: 0, y: 0 },
        rotateStartAngle: 0,
        initialBbox: null,
    });

    const handleBarRef = useRef<HTMLDivElement>(null);


    // Track mouse position globally for hover detection
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }, []);

    // Continuously compute bounding box from DOM
    useEffect(() => {
        let animId: number;
        const update = () => {
            const refsMap = widgetRefsMap.current;
            if (!refsMap) { animId = requestAnimationFrame(update); return; }
            const rects: DOMRect[] = [];
            for (const id of memberIds) {
                const el = refsMap.get(id);
                if (el) rects.push(el.getBoundingClientRect());
            }
            if (rects.length > 0) {
                const padding = 8;
                const left = Math.min(...rects.map(r => r.left)) - padding;
                const top = Math.min(...rects.map(r => r.top)) - padding;
                const right = Math.max(...rects.map(r => r.right)) + padding;
                const bottom = Math.max(...rects.map(r => r.bottom)) + padding;
                const newBbox = { x: left, y: top, w: right - left, h: bottom - top };

                setBbox(prev => {
                    if (prev && Math.abs(prev.x - left) < 0.5 && Math.abs(prev.y - top) < 0.5
                        && Math.abs(prev.w - (right - left)) < 0.5 && Math.abs(prev.h - (bottom - top)) < 0.5) {
                        return prev;
                    }
                    return newBbox;
                });

                // Detect hover over bbox area
                const mx = mouseRef.current.x;
                const my = mouseRef.current.y;
                // Add significant bleed for small/thin widgets so handles don't flicker
                const bleedX = 120;
                const isOver = mx >= newBbox.x - bleedX && mx <= newBbox.x + newBbox.w + bleedX &&
                    my >= newBbox.y && my <= newBbox.y + newBbox.h + 80;
                setIsHovered(isOver && (!isGlobalManipulating || isDragging || isResizing || isRotating));
            } else {
                setBbox(null);
                setIsHovered(false);
            }
            animId = requestAnimationFrame(update);
        };
        animId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animId);
    }, [memberIds, widgetRefsMap, isGlobalManipulating, isDragging, isResizing, isRotating]);

    // We now rely entirely on Props for the current state to ensure sync
    // with memory-based live states in App.tsx.
    const readAnchorState = (): WidgetState => {
        return externalAnchorState || { px: 0, py: 0, scale: 1, rotation: 0 };
    };



    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onManipulationStart?.();
        setIsDragging(true);

        const st = readAnchorState();
        manipRef.current = { ...manipRef.current, mouseX: e.clientX, mouseY: e.clientY, initialState: st };

        if (import.meta.env.DEV) {
            console.log(`[MoveDebug] START [${groupId}] - Anchor: ${anchorId}, px: ${st.px.toFixed(4)}, py: ${st.py.toFixed(4)}`);
            memberIds.forEach(id => {
                const s = localStorage.getItem(`overlay_widget_v4_${id}`);
                if (s) {
                    const mst = JSON.parse(s);
                    console.log(`[MoveDebug] Initial State [${id}]: px=${mst.px.toFixed(4)}, py=${mst.py.toFixed(4)}, rot=${mst.rotation.toFixed(1)}`);
                }
            });
        }

    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onManipulationStart?.();
        setIsResizing(true);

        manipRef.current = { ...manipRef.current, mouseX: e.clientX, initialState: readAnchorState() };
    };

    const handleRotateStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!bbox) return;
        onManipulationStart?.();
        const cx = bbox.x + bbox.w / 2;

        const cy = bbox.y + bbox.h / 2;
        setIsRotating(true);
        setVisualRotateAngle(0);
        manipRef.current = {
            ...manipRef.current,
            initialState: readAnchorState(),
            rotateCenter: { x: cx, y: cy },
            rotateCenterNormalized: {
                x: (cx / window.innerWidth) - 0.5,
                y: (cy / window.innerHeight) - 0.5
            },
            rotateStartAngle: Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI),
            initialBbox: { ...bbox }
        };


        if (import.meta.env.DEV) {
            console.log(`[RotateDebug] START [${groupId}] - Center: (${cx.toFixed(1)}, ${cy.toFixed(1)})`);
            memberIds.forEach(id => {
                const s = localStorage.getItem(`overlay_widget_v4_${id}`);
                if (s) {
                    const st = JSON.parse(s);
                    console.log(`[RotateDebug] Initial State [${id}]: px=${st.px.toFixed(4)}, py=${st.py.toFixed(4)}, rot=${st.rotation.toFixed(1)}`);
                }
            });

        }
    };





    const handleReset = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onReset) {
            onReset(groupId);
        } else {
            onAnchorStateChange(anchorId, { px: 0, py: 0, scale: 1, rotation: 0 }, memberIds);
        }
    };

    // Mouse move/up
    useEffect(() => {
        if (!isDragging && !isResizing && !isRotating) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { initialState } = manipRef.current;

            if (isDragging) {
                const dx = e.clientX - manipRef.current.mouseX;
                const dy = e.clientY - manipRef.current.mouseY;
                const nextPx = Math.min(Math.max(initialState.px + dx / window.innerWidth, -0.5), 0.5);
                const nextPy = Math.min(Math.max(initialState.py + dy / window.innerHeight, -0.5), 0.5);

                if (import.meta.env.DEV) {
                    const lastLogX = (manipRef.current as any).lastLogX || 0;
                    const lastLogY = (manipRef.current as any).lastLogY || 0;
                    if (Math.abs(lastLogX - dx) > 30 || Math.abs(lastLogY - dy) > 30) {
                        (manipRef.current as any).lastLogX = dx;
                        (manipRef.current as any).lastLogY = dy;
                        console.log(`[MoveDebug] UPDATE [${groupId}] - dx: ${dx.toFixed(1)}, dy: ${dy.toFixed(1)}`);
                    }
                }

                onAnchorStateChange(anchorId, {
                    ...initialState,
                    px: nextPx,
                    py: nextPy,
                }, memberIds);

            } else if (isResizing) {
                const dx = e.clientX - manipRef.current.mouseX;
                const newScale = Math.min(Math.max(initialState.scale + dx / 200, 0.3), 3);
                onAnchorStateChange(anchorId, { ...initialState, scale: newScale }, memberIds);
            } else if (isRotating) {
                const { rotateCenter, rotateCenterNormalized, rotateStartAngle, initialState } = manipRef.current;
                const currentAngle = Math.atan2(e.clientY - rotateCenter.y, e.clientX - rotateCenter.x) * (180 / Math.PI);
                let angleDiff = currentAngle - rotateStartAngle;
                let newRotation = (initialState.rotation + angleDiff) % 360;
                if (newRotation < 0) newRotation += 360;

                // Snap
                for (const snap of [0, 90, 180, 270, 360]) {
                    if (Math.abs(newRotation - snap) < 10) {
                        const snapTarget = snap % 360;
                        const snapAdjustment = snap - newRotation;
                        angleDiff += snapAdjustment;
                        newRotation = snapTarget;
                        break;
                    }
                }

                const rad = angleDiff * (Math.PI / 180);
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);

                const dx_px = (initialState.px - rotateCenterNormalized.x) * window.innerWidth;
                const dy_px = (initialState.py - rotateCenterNormalized.y) * window.innerHeight;

                const new_dx_px = dx_px * cos - dy_px * sin;
                const new_dy_px = dx_px * sin + dy_px * cos;

                const newPx = rotateCenterNormalized.x + (new_dx_px / window.innerWidth);
                const newPy = rotateCenterNormalized.y + (new_dy_px / window.innerHeight);

                setVisualRotateAngle(angleDiff);

                onAnchorStateChange(anchorId, {
                    ...initialState,
                    px: newPx,
                    py: newPy,
                    rotation: newRotation
                }, memberIds);
            }


        };

        const handleMouseUp = () => {
            if (import.meta.env.DEV) {
                if (isDragging) {
                    console.log(`[MoveDebug] FINISH [${groupId}]`);
                    memberIds.forEach(id => {
                        const s = localStorage.getItem(`overlay_widget_v4_${id}`);
                        if (s) {
                            const st = JSON.parse(s);
                            console.log(`[MoveDebug] Final State [${id}]: px=${st.px.toFixed(4)}, py=${st.py.toFixed(4)}, rot=${st.rotation.toFixed(1)}`);
                        }
                    });
                } else if (isRotating) {
                    console.log(`[RotateDebug] FINISH [${groupId}]`);
                    memberIds.forEach(id => {
                        const s = localStorage.getItem(`overlay_widget_v4_${id}`);
                        if (s) {
                            const st = JSON.parse(s);
                            // Initial rotation center was captured at rotation start
                            const { rotateCenterNormalized } = manipRef.current;
                            const d_px = Math.sqrt(
                                Math.pow((st.px - rotateCenterNormalized.x) * window.innerWidth, 2) +
                                Math.pow((st.py - rotateCenterNormalized.y) * window.innerHeight, 2)
                            );
                            console.log(`[RotateDebug] Final State [${id}]: px=${st.px.toFixed(4)}, py=${st.py.toFixed(4)}, rot=${st.rotation.toFixed(1)}, dist=${d_px.toFixed(1)}px`);
                        }
                    });
                }

                // Clear move debug throttles
                (manipRef.current as any).lastLogX = 0;
                (manipRef.current as any).lastLogY = 0;
                (manipRef.current as any).prevAngleLogged = 0;
            }
            setIsDragging(false);
            setIsResizing(false);
            setIsRotating(false);
            setVisualRotateAngle(0);
            onManipulationEnd?.();
        };



        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, isRotating, anchorId, onAnchorStateChange]);

    // Viewport Clamping for group handles
    useLayoutEffect(() => {
        if (!handleBarRef.current || !bbox) return;

        const isActivelyRotating = isRotating && manipRef.current.initialBbox;
        const activeBbox = isActivelyRotating ? manipRef.current.initialBbox! : bbox;

        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        // Ideal position (center-bottom of bbox)
        const margin = 12;
        const idealX = activeBbox.x + activeBbox.w / 2;
        const idealY = activeBbox.y + activeBbox.h + margin;

        const handleWidth = handleBarRef.current.offsetWidth;
        const handleHeight = handleBarRef.current.offsetHeight;
        const screenMargin = 12;

        const minX = screenMargin + handleWidth / 2;
        const maxX = viewportW - screenMargin - handleWidth / 2;
        const minY = screenMargin + handleHeight / 2;
        const maxY = viewportH - screenMargin - handleHeight / 2;

        const clampedX = Math.min(Math.max(idealX, minX), maxX);
        const clampedY = Math.min(Math.max(idealY, minY), maxY);

        const dx = clampedX - idealX;
        const dy = clampedY - idealY;

        if (Math.abs(dx - clampedOffset.x) > 0.5 || Math.abs(dy - clampedOffset.y) > 0.5) {
            setClampedOffset({ x: dx, y: dy });
        }
    }, [bbox, isRotating, clampedOffset.x, clampedOffset.y]);

    const isActive = (isSelected || isHovered || isDragging || isResizing || isRotating) && !isDeactivated;

    if (!bbox || !isActive) return null;

    const isActivelyRotating = isRotating && manipRef.current.initialBbox;
    const renderBbox = isActivelyRotating ? manipRef.current.initialBbox! : bbox;

    return (
        <div
            className="fixed inset-0 pointer-events-none z-[150]"
            style={{
                // If rotating, we rotate the entire container of the box and handles
                transformOrigin: isActivelyRotating ? `${manipRef.current.rotateCenter.x}px ${manipRef.current.rotateCenter.y}px` : 'center',
                transform: isActivelyRotating ? `rotate(${visualRotateAngle}deg)` : 'none',
            }}
        >
            {/* Group selection frame */}
            <div
                className="absolute border-2 border-blue-400 rounded-lg"
                style={{
                    left: 0,
                    top: 0,
                    width: renderBbox.w,
                    height: renderBbox.h,
                    transform: `translate3d(${renderBbox.x}px, ${renderBbox.y}px, 0)`,
                    boxShadow: isSelected ? '0 0 16px rgba(96, 165, 250, 0.35)' : 'none',
                    opacity: (isDragging || isResizing || isRotating || ((isSelected || isHovered) && !isGlobalManipulating)) ? (isSelected ? 1 : 0.5) : 0,
                    transition: (isDragging || isResizing || isRotating || isGlobalManipulating) ? 'none' : 'opacity 0.2s',
                }}
            />

            {/* Handles below the bounding box */}
            <div
                ref={handleBarRef}
                className={`absolute pointer-events-auto flex items-center gap-2 transition-opacity duration-200 ${(isDragging || isResizing || isRotating || ((isSelected || isHovered) && !isGlobalManipulating)) ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${(isDragging || isResizing || isRotating || isGlobalManipulating) ? '' : 'animate-in fade-in zoom-in duration-200'
                    }`}
                style={{
                    left: 0,
                    top: 0,
                    transform: `translate3d(${renderBbox.x + renderBbox.w / 2 + clampedOffset.x}px, ${renderBbox.h + renderBbox.y + 12 + clampedOffset.y}px, 0) translateX(-50%)`,
                }}
            >

                <div
                    onMouseDown={handleDragStart}
                    className="bg-blue-600/80 hover:bg-blue-500 p-2 rounded-full shadow-md cursor-grab active:cursor-grabbing text-white transition-transform hover:scale-110"
                    title="ドラッグで移動"
                >
                    <Move size={17} />
                </div>
                <div
                    onMouseDown={handleRotateStart}
                    className="bg-blue-600/80 hover:bg-blue-500 p-2 rounded-full shadow-md cursor-alias text-white transition-transform hover:scale-110"
                    title="ドラッグで回転"
                >
                    <RotateCw size={17} />
                </div>
                <div
                    onMouseDown={handleResizeStart}
                    className="bg-blue-600/80 hover:bg-blue-500 p-2 rounded-full shadow-md cursor-nwse-resize text-white transition-transform hover:scale-110"
                    title="ドラッグで拡大縮小"
                >
                    <Maximize2 size={17} className="rotate-90" />
                </div>
                {groupId !== 'transient-selection' && (
                    <div
                        onClick={handleReset}
                        className="bg-red-600/80 hover:bg-red-500 p-2 rounded-full shadow-md cursor-pointer text-white transition-transform hover:scale-110 ml-2"
                        title="初期状態にリセット"
                    >
                        <Undo2 size={17} />
                    </div>
                )}
                {onUngroup && (
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onUngroup(groupId);
                        }}
                        className="bg-amber-600/80 hover:bg-amber-500 p-2 rounded-full shadow-md cursor-pointer text-white transition-transform hover:scale-110 ml-1"
                        title="グループを解除（分解）"
                    >
                        <Unlink size={17} />
                    </div>
                )}
                {onGroup && (
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onGroup(memberIds);
                        }}
                        className="bg-emerald-600/80 hover:bg-emerald-500 p-2 rounded-full shadow-md cursor-pointer text-white transition-transform hover:scale-110 ml-1"
                        title="これらをグループ化（結合）"
                    >
                        <Link size={17} />
                    </div>
                )}
            </div>
        </div>
    );
};

