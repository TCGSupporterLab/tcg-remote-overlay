import React, { useRef, useEffect, useState, useCallback } from 'react';
import Moveable, {
    type OnDrag, type OnScale, type OnRotate,
    type OnDragStart,
    type OnScaleStart,
    type OnRotateStart,
    type OnDragEnd,
    type OnDragGroupStart,
    type OnScaleGroupStart,
    type OnRotateGroupStart,
    type OnDragGroupEnd
} from 'react-moveable';
import Selecto from 'react-selecto';
import { useWidgetStore } from '../store/useWidgetStore';
import type { WidgetId, WidgetState } from '../types/widgetTypes';

// ドラッグ中の一時的な状態管理用
interface ActiveState extends WidgetState {
    posX: number;
    posY: number;
    width: number;
    height: number;
}

export const MoveableController: React.FC = () => {
    const selectedWidgetIds = useWidgetStore(s => s.selectedWidgetIds);
    const groupData = useWidgetStore(s => s.groupData);
    const setSelectedWidgets = useWidgetStore(s => s.setSelectedWidgets);
    const setActiveMoveableRect = useWidgetStore(s => s.setActiveMoveableRect);
    const updateWidgetState = useWidgetStore(s => s.updateWidgetState);

    const [targets, setTargets] = useState<Array<HTMLElement | SVGElement>>([]);
    const [viewSize, setViewSize] = useState({
        w: window.innerWidth,
        h: window.innerHeight
    });
    const moveableRef = useRef<Moveable>(null);

    // 手動DOM更新用
    const activeStatesRef = useRef<Map<string, ActiveState>>(new Map());

    // 画面リサイズ監視
    useEffect(() => {
        const handleResize = () => {
            setViewSize({
                w: window.innerWidth,
                h: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
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

        // ターゲット変更時に一旦リセット、または初期Rectを設定
        if (elements.length > 0) {
            setTimeout(() => {
                if (moveableRef.current) {
                    const rect = moveableRef.current.getRect();
                    setActiveMoveableRect({
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                        rotation: rect.rotation,
                    });
                }
            }, 0);
        } else {
            setActiveMoveableRect(null);
        }
    }, [selectedWidgetIds, groupData.groups, setActiveMoveableRect]);

    const startAction = (id: string | null) => {
        if (!id) return;
        const el = document.querySelector(`[data-widget-id="${id}"]`) as HTMLElement;
        if (!el) return;

        if (!activeStatesRef.current.has(id)) {
            const s = useWidgetStore.getState().widgetStates[id as WidgetId] || { px: 0, py: 0, scale: 1, rotation: 0 };
            activeStatesRef.current.set(id, {
                ...s,
                posX: s.px * viewSize.w,
                posY: s.py * viewSize.h,
                width: el.offsetWidth,
                height: el.offsetHeight,
            });
        }
    };

    const clampState = (state: ActiveState) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const halfW = vw / 2;
        const halfH = vh / 2;
        const sw = state.width * state.scale;
        const sh = state.height * state.scale;
        const margin = Math.min(40, sw * 0.5, sh * 0.5);

        const minX = -halfW - sw / 2 + margin;
        const maxX = halfW + sw / 2 - margin;
        const minY = -halfH - sh / 2 + margin;
        const maxY = halfH + sh / 2 - margin;

        state.posX = Math.max(minX, Math.min(maxX, state.posX));
        state.posY = Math.max(minY, Math.min(maxY, state.posY));
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

    // --- Handlers ---
    const handleDragStart = useCallback(({ target }: OnDragStart) => startAction(target.getAttribute('data-widget-id')), [viewSize]);
    const handleDrag = useCallback(({ target, delta }: OnDrag) => {
        const id = target.getAttribute('data-widget-id');
        const state = activeStatesRef.current.get(id || '');
        if (!id || !state) return;
        state.posX += delta[0];
        state.posY += delta[1];
        clampState(state);
        updateDOMTransform(target as HTMLElement, state);
    }, [viewSize.w, viewSize.h]);

    const handleScaleStart = useCallback(({ target }: OnScaleStart) => startAction(target.getAttribute('data-widget-id')), [viewSize]);
    const handleScale = useCallback(({ target, scale, drag }: OnScale) => {
        const id = target.getAttribute('data-widget-id');
        const state = activeStatesRef.current.get(id || '');
        if (!id || !state) return;
        state.scale = scale[0];
        if (drag) {
            state.posX += drag.delta[0];
            state.posY += drag.delta[1];
        }
        clampState(state);
        updateDOMTransform(target as HTMLElement, state);
    }, [viewSize.w, viewSize.h]);

    const handleRotateStart = useCallback(({ target }: OnRotateStart) => startAction(target.getAttribute('data-widget-id')), [viewSize]);
    const handleRotate = useCallback(({ target, rotate, drag }: OnRotate) => {
        const id = target.getAttribute('data-widget-id');
        const state = activeStatesRef.current.get(id || '');
        if (!id || !state) return;
        state.rotation = rotate;
        if (drag) {
            state.posX += drag.delta[0];
            state.posY += drag.delta[1];
        }
        clampState(state);
        updateDOMTransform(target as HTMLElement, state);
    }, [viewSize.w, viewSize.h]);

    const handleEnd = useCallback(() => {
        const ids = Array.from(activeStatesRef.current.keys());
        endAction(ids);
        if (moveableRef.current) {
            const rect = moveableRef.current.getRect();
            setActiveMoveableRect({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                rotation: rect.rotation,
            });
        }
    }, [setActiveMoveableRect, viewSize]);

    // Group handlers
    const handleDragGroupStart = useCallback(({ targets }: OnDragGroupStart) => targets.forEach(t => startAction(t.getAttribute('data-widget-id'))), [viewSize]);
    const handleScaleGroupStart = useCallback(({ targets }: OnScaleGroupStart) => targets.forEach(t => startAction(t.getAttribute('data-widget-id'))), [viewSize]);
    const handleRotateGroupStart = useCallback(({ targets }: OnRotateGroupStart) => targets.forEach(t => startAction(t.getAttribute('data-widget-id'))), [viewSize]);

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
                snappable={true}
                snapRotationDegrees={[0, 90, 180, 270]}
                snapRotationThreshold={5}

                onDragStart={(e) => { handleDragStart(e); }}
                onDrag={handleDrag}
                onDragEnd={(e: OnDragEnd) => {
                    handleEnd();
                    // 他の要素が選択されている状態で Ctrl+Click した際の選択解除をサポート (Selecto がバイパスされた場合の補完)
                    if (!e.isDrag && (e.inputEvent.ctrlKey || e.inputEvent.metaKey)) {
                        const inputTarget = e.inputEvent.target as HTMLElement;
                        if (!inputTarget.closest('[class*="moveable-control"]')) {
                            const widgetEl = inputTarget.closest('[data-widget-id]');
                            const id = widgetEl?.getAttribute('data-widget-id') as WidgetId;
                            if (id) {
                                const current = useWidgetStore.getState().selectedWidgetIds;
                                const group = groupData.groups.find(g => g.memberIds.includes(id) || g.id === id);
                                const idsToRemove = group ? [group.id, ...group.memberIds] : [id];
                                setSelectedWidgets(current.filter(i => !idsToRemove.includes(i)));
                            }
                        }
                    }
                }}

                onScaleStart={(e) => { handleScaleStart(e); }}
                onScale={handleScale}
                onScaleEnd={() => { handleEnd(); }}

                onRotateStart={(e) => { handleRotateStart(e); }}
                onRotate={handleRotate}
                onRotateEnd={() => { handleEnd(); }}

                onDragGroupStart={(e) => { handleDragGroupStart(e); }}
                onDragGroup={({ events }) => events.forEach(handleDrag)}
                onDragGroupEnd={(e: OnDragGroupEnd) => {
                    handleEnd();
                    // グループ選択状態で Ctrl+Click した際の選択解除をサポート
                    if (!e.isDrag && (e.inputEvent.ctrlKey || e.inputEvent.metaKey)) {
                        const inputTarget = e.inputEvent.target as HTMLElement;
                        if (!inputTarget.closest('[class*="moveable-control"]')) {
                            const widgetEl = inputTarget.closest('[data-widget-id]');
                            const id = widgetEl?.getAttribute('data-widget-id') as WidgetId;
                            if (id) {
                                const current = useWidgetStore.getState().selectedWidgetIds;
                                const group = groupData.groups.find(g => g.memberIds.includes(id) || g.id === id);
                                const idsToRemove = group ? [group.id, ...group.memberIds] : [id];
                                setSelectedWidgets(current.filter(i => !idsToRemove.includes(i)));
                            }
                        }
                    }
                }}

                onScaleGroupStart={(e) => { handleScaleGroupStart(e); }}
                onScaleGroup={({ events }) => events.forEach(handleScale)}
                onScaleGroupEnd={() => { handleEnd(); }}

                onRotateGroupStart={(e) => { handleRotateGroupStart(e); }}
                onRotateGroup={({ events }) => events.forEach(handleRotate)}
                onRotateGroupEnd={() => { handleEnd(); }}

                onRender={() => {
                    if (moveableRef.current) {
                        const mRect = moveableRef.current.getRect();
                        setActiveMoveableRect({
                            left: mRect.left,
                            top: mRect.top,
                            width: mRect.width,
                            height: mRect.height,
                            rotation: mRect.rotation,
                        });
                    }
                }}
            />
            <Selecto
                dragContainer={window}
                selectableTargets={['[data-widget-id]']}
                hitRate={0}
                selectByClick={true}
                selectFromInside={false}
                toggleContinueSelect={['ctrlKey', 'metaKey']}
                continueSelect={true}
                ratio={0}
                dragCondition={(e) => {
                    const target = e.inputEvent.target as Element;
                    if (target.closest('.selection-action-bar')) return false;
                    const isCtrl = e.inputEvent.ctrlKey || e.inputEvent.metaKey;
                    const isMoveableElement = !!target.closest('[class*="moveable-"]');
                    const isControl = !!target.closest('[class*="moveable-control"]');
                    if (isMoveableElement) {
                        if (isControl) return false;
                        if (!isCtrl) return false;
                    }
                    const isWidget = !!target.closest('[data-widget-id]');
                    // すでに選択されているウィジェット上で Ctrl を押しながらドラッグを開始した場合は、
                    // Selecto ではなく Moveable にドラッグ(移動)を任せる
                    if (isWidget && isCtrl) {
                        const widgetEl = target.closest('[data-widget-id]');
                        const id = widgetEl?.getAttribute('data-widget-id');
                        if (id && selectedWidgetIds.includes(id as WidgetId)) {
                            return false;
                        }
                    }
                    return !isWidget || isCtrl;
                }}
                onDragStart={(e) => {
                    const target = e.inputEvent.target as Element;
                    if (target.closest('.selection-action-bar')) {
                        e.stop();
                        return;
                    }
                    const isWidget = !!target.closest('[data-widget-id]');
                    const isMoveable = !!target.closest('[class*="moveable-"]');
                    const isCtrl = e.inputEvent.ctrlKey || e.inputEvent.metaKey;
                    if (!isWidget && !isMoveable && !isCtrl) {
                        setSelectedWidgets([]);
                        e.currentTarget.setSelectedTargets([]);
                    }
                }}
                onSelectEnd={(e) => {
                    const isCtrl = e.inputEvent.ctrlKey || e.inputEvent.metaKey;
                    let clickedEl = e.inputEvent.target as HTMLElement;
                    if (clickedEl.closest('[class*="moveable-area"]')) {
                        const mouseEvent = e.inputEvent as MouseEvent;
                        const elements = document.elementsFromPoint(mouseEvent.clientX, mouseEvent.clientY);
                        const widget = elements.find(el => el.hasAttribute('data-widget-id'));
                        if (widget) clickedEl = widget as HTMLElement;
                    }
                    const widgetEl = clickedEl.closest('[data-widget-id]');
                    const clickedId = widgetEl?.getAttribute('data-widget-id') as WidgetId | undefined;
                    const clickedGroup = clickedId ? groupData.groups.find(g => g.memberIds.includes(clickedId)) : null;
                    let clickedTargetId = clickedGroup ? clickedGroup.id : clickedId;

                    const nextIds = new Set<WidgetId>();
                    if (e.rect.width > 2 || e.rect.height > 2) {
                        e.selected.forEach(el => {
                            const id = el.getAttribute('data-widget-id') as WidgetId;
                            const group = groupData.groups.find(g => g.memberIds.includes(id));
                            nextIds.add(group ? group.id : id);
                        });
                    } else {
                        const currentIds = new Set(selectedWidgetIds);

                        // 結合ウィジェット（グループ）の枠内クリック判定（空白部分でもCtrl+クリックで選択可能にする）
                        if (!clickedTargetId && isCtrl) {
                            const inputEvent = e.inputEvent as any;
                            const clientX = inputEvent.clientX ?? inputEvent.touches?.[0]?.clientX;
                            const clientY = inputEvent.clientY ?? inputEvent.touches?.[0]?.clientY;

                            if (clientX !== undefined && clientY !== undefined) {
                                const hitGroup = groupData.groups.find(group => {
                                    const rects = group.memberIds.map(id => {
                                        const el = document.querySelector(`[data-widget-id="${id}"]`);
                                        return el?.getBoundingClientRect();
                                    }).filter((r): r is DOMRect => !!r);

                                    if (rects.length === 0) return false;

                                    const minX = Math.min(...rects.map(r => r.left));
                                    const minY = Math.min(...rects.map(r => r.top));
                                    const maxX = Math.max(...rects.map(r => r.right));
                                    const maxY = Math.max(...rects.map(r => r.bottom));

                                    return clientX >= minX && clientX <= maxX && clientY >= minY && clientY <= maxY;
                                });
                                if (hitGroup) {
                                    clickedTargetId = hitGroup.id as WidgetId;
                                }
                            }
                        }

                        if (clickedTargetId) {
                            if (isCtrl) {
                                if (currentIds.has(clickedTargetId)) currentIds.delete(clickedTargetId);
                                else currentIds.add(clickedTargetId);
                            } else {
                                currentIds.clear();
                                currentIds.add(clickedTargetId);
                            }
                        } else if (!isCtrl) {
                            currentIds.clear();
                        }
                        currentIds.forEach(id => nextIds.add(id));
                    }
                    const finalIds = Array.from(nextIds);
                    setSelectedWidgets(finalIds);
                    const finalElements = finalIds.flatMap(id => {
                        const group = groupData.groups.find(g => g.id === id);
                        return group ? group.memberIds : [id];
                    }).map(mid => document.querySelector(`[data-widget-id="${mid}"]`))
                        .filter((el): el is HTMLElement => el !== null);
                    e.currentTarget.setSelectedTargets(finalElements);
                }}
            />
        </div>
    );
};
