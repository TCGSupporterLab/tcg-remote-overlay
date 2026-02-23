import React, { useState, useEffect, useRef } from 'react';
import { Move, Maximize2, RotateCw, Undo2 } from 'lucide-react';
import type { WidgetId, WidgetState } from '../types/widgetTypes';

interface GroupBoundingBoxProps {
    groupId: string;
    memberIds: WidgetId[];
    anchorId: WidgetId;
    isSelected: boolean;
    widgetRefsMap: React.RefObject<Map<WidgetId, HTMLDivElement>>;
    onAnchorStateChange: (anchorId: WidgetId, newState: WidgetState) => void;
}

export const GroupBoundingBox: React.FC<GroupBoundingBoxProps> = ({
    memberIds,
    anchorId,
    isSelected,
    widgetRefsMap,
    onAnchorStateChange,
}) => {
    const [bbox, setBbox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isRotating, setIsRotating] = useState(false);

    const mouseRef = useRef({ x: 0, y: 0 });
    const manipRef = useRef({
        mouseX: 0,
        mouseY: 0,
        initialState: { px: 0, py: 0, scale: 1, rotation: 0 } as WidgetState,
        rotateCenter: { x: 0, y: 0 },
        rotateStartAngle: 0,
    });

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
                // Add some bleed for the handle area below (approx 60px)
                const isOver = mx >= newBbox.x && mx <= newBbox.x + newBbox.w &&
                    my >= newBbox.y && my <= newBbox.y + newBbox.h + 60;
                setIsHovered(isOver);
            } else {
                setBbox(null);
                setIsHovered(false);
            }
            animId = requestAnimationFrame(update);
        };
        animId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animId);
    }, [memberIds, widgetRefsMap]);

    const readAnchorState = (): WidgetState => {
        const saved = localStorage.getItem(`overlay_widget_v4_${anchorId}`);
        return saved ? JSON.parse(saved) : { px: 0, py: 0, scale: 1, rotation: 0 };
    };

    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        manipRef.current = { ...manipRef.current, mouseX: e.clientX, mouseY: e.clientY, initialState: readAnchorState() };
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        manipRef.current = { ...manipRef.current, mouseX: e.clientX, initialState: readAnchorState() };
    };

    const handleRotateStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!bbox) return;
        const cx = bbox.x + bbox.w / 2;
        const cy = bbox.y + bbox.h / 2;
        setIsRotating(true);
        manipRef.current = {
            ...manipRef.current,
            initialState: readAnchorState(),
            rotateCenter: { x: cx, y: cy },
            rotateStartAngle: Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI),
        };
    };

    const handleReset = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onAnchorStateChange(anchorId, { px: 0, py: 0, scale: 1, rotation: 0 });
    };

    // Mouse move/up
    useEffect(() => {
        if (!isDragging && !isResizing && !isRotating) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { initialState } = manipRef.current;

            if (isDragging) {
                const dx = e.clientX - manipRef.current.mouseX;
                const dy = e.clientY - manipRef.current.mouseY;
                onAnchorStateChange(anchorId, {
                    ...initialState,
                    px: Math.min(Math.max(initialState.px + dx / window.innerWidth, -0.5), 0.5),
                    py: Math.min(Math.max(initialState.py + dy / window.innerHeight, -0.5), 0.5),
                });
            } else if (isResizing) {
                const dx = e.clientX - manipRef.current.mouseX;
                const newScale = Math.min(Math.max(initialState.scale + dx / 200, 0.3), 3);
                onAnchorStateChange(anchorId, { ...initialState, scale: newScale });
            } else if (isRotating) {
                const { rotateCenter, rotateStartAngle } = manipRef.current;
                const currentAngle = Math.atan2(e.clientY - rotateCenter.y, e.clientX - rotateCenter.x) * (180 / Math.PI);
                let newRotation = (initialState.rotation + (currentAngle - rotateStartAngle)) % 360;
                if (newRotation < 0) newRotation += 360;
                // Snap
                for (const snap of [0, 90, 180, 270, 360]) {
                    if (Math.abs(newRotation - snap) < 10) { newRotation = snap % 360; break; }
                }
                onAnchorStateChange(anchorId, { ...initialState, rotation: newRotation });
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
    }, [isDragging, isResizing, isRotating, anchorId, onAnchorStateChange]);

    const isActive = isSelected || isHovered || isDragging || isResizing || isRotating;

    if (!bbox || !isActive) return null;

    return (
        <>
            {/* Group selection frame */}
            <div
                className="fixed pointer-events-none z-[150] border-2 border-blue-400 rounded-lg transition-opacity duration-200"
                style={{
                    left: bbox.x,
                    top: bbox.y,
                    width: bbox.w,
                    height: bbox.h,
                    boxShadow: isSelected ? '0 0 16px rgba(96, 165, 250, 0.35)' : 'none',
                    opacity: isSelected ? 1 : 0.5,
                }}
            />

            {/* Handles below the bounding box */}
            <div
                className="fixed pointer-events-auto z-[150] flex items-center gap-2 animate-in fade-in zoom-in duration-200"
                style={{
                    left: bbox.x + bbox.w / 2,
                    top: bbox.y + bbox.h + 12,
                    transform: 'translateX(-50%)',
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
                <div
                    onClick={handleReset}
                    className="bg-red-600/80 hover:bg-red-500 p-2 rounded-full shadow-md cursor-pointer text-white transition-transform hover:scale-110 ml-2"
                    title="初期状態にリセット"
                >
                    <Undo2 size={17} />
                </div>
            </div>
        </>
    );
};
