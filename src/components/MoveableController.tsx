import React, { useRef, useEffect, useState, useCallback } from 'react';
import Moveable, {
    type OnDrag, type OnScale, type OnRotate,
    type OnDragGroup, type OnScaleGroup, type OnRotateGroup,
    type OnDragStart, type OnDragGroupStart,
    type OnScaleStart, type OnScaleGroupStart,
    type OnRotateStart, type OnRotateGroupStart
} from 'react-moveable';
import Selecto from 'react-selecto';
import { useWidgetStore } from '../store/useWidgetStore';
import type { WidgetId, WidgetState } from '../types/widgetTypes';

// ドラッグ中の一時的な状態管理用
interface ActiveState extends WidgetState {
    posX: number;
    posY: number;
}

export const MoveableController: React.FC = () => {
    const selectedWidgetIds = useWidgetStore(s => s.selectedWidgetIds);
    const groupData = useWidgetStore(s => s.groupData);
    const setSelectedWidgets = useWidgetStore(s => s.setSelectedWidgets);
    const updateWidgetState = useWidgetStore(s => s.updateWidgetState);

    const [targets, setTargets] = useState<Array<HTMLElement | SVGElement>>([]);
    const [viewSize, setViewSize] = useState({
        w: document.documentElement.clientWidth,
        h: document.documentElement.clientHeight
    });
    const moveableRef = useRef<Moveable>(null);

    // 手動DOM更新用
    const activeStatesRef = useRef<Map<string, ActiveState>>(new Map());

    // 画面リサイズ監視
    useEffect(() => {
        const handleResize = () => {
            setViewSize({
                w: document.documentElement.clientWidth,
                h: document.documentElement.clientHeight
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const allMemberIds = new Set<string>();
        selectedWidgetIds.forEach(id => {
            const group = groupData.groups.find(g => g.id === id);
            if (group) group.memberIds.forEach(mid => allMemberIds.add(mid));
            else allMemberIds.add(id);
        });

        const elements = Array.from(allMemberIds)
            .map(id => document.querySelector(`[data-widget-id="${id}"]`))
            .filter((el): el is HTMLElement => el !== null);

        setTargets(elements);
    }, [selectedWidgetIds, groupData.groups]);

    const startAction = (id: string | null) => {
        if (!id) return;
        if (!activeStatesRef.current.has(id)) {
            const s = useWidgetStore.getState().widgetStates[id as WidgetId] || { px: 0, py: 0, scale: 1, rotation: 0 };
            activeStatesRef.current.set(id, {
                ...s,
                posX: s.px * viewSize.w,
                posY: s.py * viewSize.h,
            });
        }
    };

    const updateDOMTransform = (target: HTMLElement | SVGElement, state: ActiveState) => {
        target.style.transform = `translate(${state.posX}px, ${state.posY}px) translate(-50%, -50%) scale(${state.scale}) rotate(${state.rotation}deg)`;
    };

    const endAction = (ids: string[]) => {
        ids.forEach(id => {
            const state = activeStatesRef.current.get(id);
            if (state) {
                updateWidgetState(id as WidgetId, {
                    px: state.posX / viewSize.w,
                    py: state.posY / viewSize.h,
                    scale: state.scale,
                    rotation: state.rotation,
                });
                activeStatesRef.current.delete(id);
            }
        });
    };

    // --- Single Handlers ---

    const handleDragStart = useCallback(({ target }: OnDragStart) => {
        startAction(target.getAttribute('data-widget-id'));
    }, [viewSize]);

    const handleDrag = useCallback(({ target, delta }: OnDrag) => {
        const id = target.getAttribute('data-widget-id');
        const state = activeStatesRef.current.get(id || '');
        if (!id || !state) return;

        state.posX += delta[0];
        state.posY += delta[1];
        updateDOMTransform(target as HTMLElement, state);
    }, []);

    const handleScaleStart = useCallback(({ target }: OnScaleStart) => {
        startAction(target.getAttribute('data-widget-id'));
    }, [viewSize]);

    const handleScale = useCallback(({ target, scale, drag }: OnScale) => {
        const id = target.getAttribute('data-widget-id');
        const state = activeStatesRef.current.get(id || '');
        if (!id || !state) return;

        state.scale = scale[0];
        if (drag) {
            state.posX += drag.delta[0];
            state.posY += drag.delta[1];
        }
        updateDOMTransform(target as HTMLElement, state);
    }, []);

    const handleRotateStart = useCallback(({ target }: OnRotateStart) => {
        startAction(target.getAttribute('data-widget-id'));
    }, [viewSize]);

    const handleRotate = useCallback(({ target, rotate, drag }: OnRotate) => {
        const id = target.getAttribute('data-widget-id');
        const state = activeStatesRef.current.get(id || '');
        if (!id || !state) return;

        state.rotation = rotate;
        if (drag) {
            state.posX += drag.delta[0];
            state.posY += drag.delta[1];
        }
        updateDOMTransform(target as HTMLElement, state);
    }, []);

    // --- Group Handlers ---

    const handleDragGroupStart = useCallback(({ targets }: OnDragGroupStart) => {
        targets.forEach(t => startAction(t.getAttribute('data-widget-id')));
    }, [viewSize]);

    const handleDragGroup = useCallback(({ events }: OnDragGroup) => {
        events.forEach(handleDrag);
    }, [handleDrag]);

    const handleScaleGroupStart = useCallback(({ targets }: OnScaleGroupStart) => {
        targets.forEach(t => startAction(t.getAttribute('data-widget-id')));
    }, [viewSize]);

    const handleScaleGroup = useCallback(({ events }: OnScaleGroup) => {
        events.forEach(handleScale);
    }, [handleScale]);

    const handleRotateGroupStart = useCallback(({ targets }: OnRotateGroupStart) => {
        targets.forEach(t => startAction(t.getAttribute('data-widget-id')));
    }, [viewSize]);

    const handleRotateGroup = useCallback(({ events }: OnRotateGroup) => {
        events.forEach(handleRotate);
    }, [handleRotate]);

    const handleEnd = useCallback(() => {
        const ids = Array.from(activeStatesRef.current.keys());
        endAction(ids);
    }, [updateWidgetState, viewSize]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[999]">
            <Moveable
                ref={moveableRef}
                target={targets.length === 1 ? targets[0] : targets}
                draggable={true}
                scalable={true}
                rotatable={true}
                keepRatio={true}
                throttleDrag={0}
                throttleScale={0}
                throttleRotate={0}
                useResizeObserver={true}
                origin={false}
                padding={{ left: 0, top: 0, right: 0, bottom: 0 }}

                // --- 回転のスナップ設定 ---
                snappable={true}
                snapRotationDegrees={[0, 90, 180, 270]}
                snapRotationThreshold={5}

                // --- 画面外への飛び出し防止設定 ---
                bounds={{
                    left: 0,
                    top: 0,
                    right: viewSize.w,
                    bottom: viewSize.h
                }}

                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleEnd}

                onScaleStart={handleScaleStart}
                onScale={handleScale}
                onScaleEnd={handleEnd}

                onRotateStart={handleRotateStart}
                onRotate={handleRotate}
                onRotateEnd={handleEnd}

                onDragGroupStart={handleDragGroupStart}
                onDragGroup={handleDragGroup}
                onDragGroupEnd={handleEnd}

                onScaleGroupStart={handleScaleGroupStart}
                onScaleGroup={handleScaleGroup}
                onScaleGroupEnd={handleEnd}

                onRotateGroupStart={handleRotateGroupStart}
                onRotateGroup={handleRotateGroup}
                onRotateGroupEnd={handleEnd}
            />
            <Selecto
                dragContainer={window}
                selectableTargets={['[data-widget-id]']}
                hitRate={0}
                selectByClick={true}
                selectFromInside={false}
                toggleContinueSelect={['ctrlKey', 'metaKey']}
                ratio={0}
                dragCondition={(e) => {
                    const target = e.inputEvent.target as Element;
                    const isMoveableElement = !!target.closest('[class*="moveable-"]');
                    if (isMoveableElement) return false;
                    const isWidget = !!target.closest('[data-widget-id]');
                    const isCtrl = e.inputEvent.ctrlKey || e.inputEvent.metaKey;
                    return !isWidget || isCtrl;
                }}
                onSelectEnd={(e) => {
                    const selected = e.selected.map(el => el.getAttribute('data-widget-id') as WidgetId);
                    const nextIds = new Set<WidgetId>();
                    selected.forEach(id => {
                        const group = groupData.groups.find(g => g.memberIds.includes(id));
                        if (group) nextIds.add(group.id);
                        else nextIds.add(id);
                    });
                    setSelectedWidgets(Array.from(nextIds));
                }}
            />
        </div>
    );
};
