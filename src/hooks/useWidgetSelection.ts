import { useCallback } from 'react';
import type { WidgetId } from '../types/widgetTypes';
import { useWidgetStore } from '../store/useWidgetStore';

interface UseWidgetSelectionReturn {
    selectedWidgetIds: WidgetId[];
    isSelecting: boolean;
    toggleSelect: (id: WidgetId, ctrlKey: boolean) => void;
    clearSelection: () => void;
    selectIds: (ids: WidgetId[]) => void;
    setIsSelecting: (val: boolean) => void;
}

/**
 * Hook to manage widget selection state.
 * Actual rectangle selection logic is now handled by Selecto in MoveableController.
 */
export const useWidgetSelection = (): UseWidgetSelectionReturn => {
    // セレクタを使用して個別に購読することで、無関係なステート更新（ドラッグ中の座標更新など）による
    // コンポーネントの不要な再描画を防止する。
    const selectedWidgetIds = useWidgetStore(s => s.selectedWidgetIds);
    const isSelecting = useWidgetStore(s => s.isSelecting);

    // Actions は不変なので、まとめて取得してもパフォーマンスに影響しない
    const setSelectedWidgets = useWidgetStore(s => s.setSelectedWidgets);
    const setIsSelecting = useWidgetStore(s => s.setIsSelecting);
    const setSelectionRect = useWidgetStore(s => s.setSelectionRect);

    const toggleSelect = useCallback((id: WidgetId, ctrlKey: boolean) => {
        if (ctrlKey) {
            // Ctrl+Click: toggle selection
            const next = selectedWidgetIds.includes(id)
                ? selectedWidgetIds.filter(i => i !== id)
                : [...selectedWidgetIds, id];
            setSelectedWidgets(next);
        }
    }, [selectedWidgetIds, setSelectedWidgets]);

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
        toggleSelect,
        clearSelection,
        selectIds,
        setIsSelecting,
    };
};
