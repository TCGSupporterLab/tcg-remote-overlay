import { useState, useCallback, useRef } from 'react';
import type { WidgetId } from '../types/widgetTypes';

interface SelectionRect {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

interface UseWidgetSelectionReturn {
    selectedWidgetIds: Set<WidgetId>;
    isSelecting: boolean;
    selectionRect: SelectionRect | null;
    toggleSelect: (id: WidgetId, ctrlKey: boolean) => void;
    startRectSelection: (e: React.MouseEvent) => void;
    updateRectSelection: (e: React.MouseEvent) => void;
    finishRectSelection: (getWidgetRects: () => Map<WidgetId, DOMRect>) => void;
    clearSelection: () => void;
}

export const useWidgetSelection = (): UseWidgetSelectionReturn => {
    const [selectedWidgetIds, setSelectedWidgetIds] = useState<Set<WidgetId>>(new Set());
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
    const selectionRectRef = useRef<SelectionRect | null>(null);

    const toggleSelect = useCallback((id: WidgetId, ctrlKey: boolean) => {
        setSelectedWidgetIds(prev => {
            if (ctrlKey) {
                // Ctrl+Click: toggle selection
                const next = new Set(prev);
                if (next.has(id)) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
                return next;
            } else {
                // Normal click: single select (clear others)
                if (prev.size === 1 && prev.has(id)) {
                    // Clicking the same single-selected widget: deselect
                    return new Set();
                }
                return new Set([id]);
            }
        });
    }, []);

    const startRectSelection = useCallback((e: React.MouseEvent) => {
        const rect: SelectionRect = {
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
        };
        setIsSelecting(true);
        setSelectionRect(rect);
        selectionRectRef.current = rect;
    }, []);

    const updateRectSelection = useCallback((e: React.MouseEvent) => {
        if (!selectionRectRef.current) return;
        const updated: SelectionRect = {
            ...selectionRectRef.current,
            currentX: e.clientX,
            currentY: e.clientY,
        };
        setSelectionRect(updated);
        selectionRectRef.current = updated;
    }, []);

    const finishRectSelection = useCallback((getWidgetRects: () => Map<WidgetId, DOMRect>) => {
        if (!selectionRectRef.current) {
            setIsSelecting(false);
            return;
        }

        const sr = selectionRectRef.current;
        const left = Math.min(sr.startX, sr.currentX);
        const top = Math.min(sr.startY, sr.currentY);
        const right = Math.max(sr.startX, sr.currentX);
        const bottom = Math.max(sr.startY, sr.currentY);

        // Only select if drag area is meaningful (> 5px)
        const width = right - left;
        const height = bottom - top;

        if (width > 5 && height > 5) {
            const widgetRects = getWidgetRects();
            const selected = new Set<WidgetId>();

            widgetRects.forEach((rect, id) => {
                // Check intersection between selection rect and widget bounding rect
                const intersects =
                    rect.left < right &&
                    rect.right > left &&
                    rect.top < bottom &&
                    rect.bottom > top;
                if (intersects) {
                    selected.add(id);
                }
            });

            setSelectedWidgetIds(selected);
        }

        setIsSelecting(false);
        setSelectionRect(null);
        selectionRectRef.current = null;
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedWidgetIds(new Set());
        setIsSelecting(false);
        setSelectionRect(null);
        selectionRectRef.current = null;
    }, []);

    return {
        selectedWidgetIds,
        isSelecting,
        selectionRect,
        toggleSelect,
        startRectSelection,
        updateRectSelection,
        finishRectSelection,
        clearSelection,
    };
};
