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
    const setActiveMoveableRect = useWidgetStore(s => s.setActiveMoveableRect);
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

        // 操作終了後の最終的な位置を更新
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
    }, [updateWidgetState, viewSize, setActiveMoveableRect]);

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

                // --- 選択枠（Rect）の同期 ---
                onRender={(_e) => {
                    // getRect() は Moveable 自身の全体領域（回転含む）を取得するため、
                    // ここでは実際の DOM 座標を元にストアを更新
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

                    // 操作バーへの操作は Selecto 側で無視する
                    if (target.closest('.selection-action-bar')) return false;

                    const isCtrl = e.inputEvent.ctrlKey || e.inputEvent.metaKey;
                    const isMoveableElement = !!target.closest('[class*="moveable-"]');
                    const isControl = !!target.closest('[class*="moveable-control"]');

                    // Moveableのコントロール（ハンドル）は常に避ける。
                    // それ以外の要素（area 等）は Ctrl クリック時のみ Selecto に通す（背後のウィジェットを選択するため）。
                    if (isMoveableElement) {
                        if (isControl) return false;
                        if (!isCtrl) return false;
                    }

                    const isWidget = !!target.closest('[data-widget-id]');
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

                    // ウィジェットでもMoveable操作ハンドルでもなく、かつCtrl同時押しでない場合は選択を解除
                    if (!isWidget && !isMoveable && !isCtrl) {
                        setSelectedWidgets([]);
                        e.currentTarget.setSelectedTargets([]);
                    }
                }}
                onSelectEnd={(e) => {
                    const isCtrl = e.inputEvent.ctrlKey || e.inputEvent.metaKey;

                    // 1. クリック位置からターゲットウィジェットを特定（Moveableエリア越しに対応）
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
                    const clickedTargetId = clickedGroup ? clickedGroup.id : clickedId;

                    // 2. 選択状態の計算
                    const nextIds = new Set<WidgetId>();

                    // ドラッグ範囲選択の場合は、Selecto の結果を正規化して採用
                    if (e.rect.width > 2 || e.rect.height > 2) {
                        e.selected.forEach(el => {
                            const id = el.getAttribute('data-widget-id') as WidgetId;
                            const group = groupData.groups.find(g => g.memberIds.includes(id));
                            nextIds.add(group ? group.id : id);
                        });
                    } else {
                        // クリック（単一選択またはトグル動作）の場合
                        const currentIds = new Set(selectedWidgetIds);
                        if (clickedTargetId) {
                            if (isCtrl) {
                                // トグル動作
                                if (currentIds.has(clickedTargetId)) {
                                    currentIds.delete(clickedTargetId);
                                } else {
                                    currentIds.add(clickedTargetId);
                                }
                            } else {
                                // 通常クリック（これのみを選択）
                                currentIds.clear();
                                currentIds.add(clickedTargetId);
                            }
                        } else if (!isCtrl) {
                            // 何もない場所をクリック
                            currentIds.clear();
                        }
                        currentIds.forEach(id => nextIds.add(id));
                    }

                    const finalIds = Array.from(nextIds);
                    setSelectedWidgets(finalIds);

                    // 3. Selecto 内部の状態を実際の要素リストに同期
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
