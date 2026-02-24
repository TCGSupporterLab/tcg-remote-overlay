import { useCallback, useRef } from 'react';
import type { WidgetId } from '../types/widgetTypes';
import { useWidgetStore } from '../store/useWidgetStore';

interface UseWidgetSelectionReturn {
    selectedWidgetIds: WidgetId[];
    isSelecting: boolean;
    selectionRect: { startX: number; startY: number; currentX: number; currentY: number } | null;
    toggleSelect: (id: WidgetId, ctrlKey: boolean) => void;
    startRectSelection: (e: React.MouseEvent) => void;
    updateRectSelection: (e: React.MouseEvent) => void;
    finishRectSelection: (getWidgetRects: () => Map<WidgetId, DOMRect>, transformSelection?: (ids: WidgetId[]) => WidgetId[]) => void;
    clearSelection: () => void;
    selectIds: (ids: WidgetId[]) => void;
}

export const useWidgetSelection = (): UseWidgetSelectionReturn => {
    const {
        selectedWidgetIds,
        isSelecting,
        selectionRect,
        setSelectedWidgets,
        setIsSelecting,
        setSelectionRect
    } = useWidgetStore();

    const selectionRectRef = useRef(selectionRect);
    selectionRectRef.current = selectionRect;

    const toggleSelect = useCallback((id: WidgetId, ctrlKey: boolean) => {
        if (ctrlKey) {
            // Ctrl+Click: toggle selection
            const next = selectedWidgetIds.includes(id)
                ? selectedWidgetIds.filter(i => i !== id)
                : [...selectedWidgetIds, id];
            setSelectedWidgets(next);
        } else {
            // Normal click: single select (clear others)
            if (selectedWidgetIds.length === 1 && selectedWidgetIds.includes(id)) {
                // Clicking the same single-selected widget: deselect
                setSelectedWidgets([]);
            } else {
                setSelectedWidgets([id]);
            }
        }
    }, [selectedWidgetIds, setSelectedWidgets]);

    const startRectSelection = useCallback((e: React.MouseEvent) => {
        const rect = {
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
        };
        setIsSelecting(true);
        setSelectionRect(rect);
    }, [setIsSelecting, setSelectionRect]);

    const updateRectSelection = useCallback((e: React.MouseEvent) => {
        if (!selectionRectRef.current) return;
        const updated = {
            ...selectionRectRef.current,
            currentX: e.clientX,
            currentY: e.clientY,
        };
        setSelectionRect(updated);
    }, [setSelectionRect]);

    const finishRectSelection = useCallback((
        getWidgetRects: () => Map<WidgetId, DOMRect>,
        transformSelection?: (ids: WidgetId[]) => WidgetId[]
    ) => {
        if (!selectionRectRef.current) {
            setIsSelecting(false);
            return;
        }

        const sr = selectionRectRef.current;
        const left = Math.min(sr.startX, sr.currentX);
        const top = Math.min(sr.startY, sr.currentY);
        const right = Math.max(sr.startX, sr.currentX);
        const bottom = Math.max(sr.startY, sr.currentY);

        const width = right - left;
        const height = bottom - top;

        if (width > 5 && height > 5) {
            const widgetRects = getWidgetRects();
            const selected: WidgetId[] = [];

            widgetRects.forEach((rect, id) => {
                const intersects =
                    rect.left < right &&
                    rect.right > left &&
                    rect.top < bottom &&
                    rect.bottom > top;
                if (intersects) {
                    selected.push(id);
                }
            });

            const finalSelected = transformSelection ? transformSelection(selected) : selected;
            setSelectedWidgets(finalSelected);
        } else {
            setSelectedWidgets([]);
        }

        setIsSelecting(false);
        setSelectionRect(null);
    }, [setSelectedWidgets, setIsSelecting, setSelectionRect]);

    const clearSelection = useCallback(() => {
        setSelectedWidgets([]);
        setIsSelecting(false);
        setSelectionRect(null);
    }, [setSelectedWidgets, setIsSelecting, setSelectionRect]);

    const selectIds = useCallback((ids: WidgetId[]) => {
        setSelectedWidgets(ids);
    }, [setSelectedWidgets]);

    return {
        selectedWidgetIds,
        isSelecting,
        selectionRect,
        toggleSelect,
        startRectSelection,
        updateRectSelection,
        finishRectSelection,
        clearSelection,
        selectIds,
    };
};
