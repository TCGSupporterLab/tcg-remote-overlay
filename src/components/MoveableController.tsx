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
    const setIsTransforming = useWidgetStore(s => s.setIsTransforming);
    const updateWidgetState = useWidgetStore(s => s.updateWidgetState);
    const viewSize = useWidgetStore(s => s.viewSize);
    const setViewSize = useWidgetStore(s => s.setViewSize);
    const SCALING_BASE_W = 1920;
    const SCALING_BASE_H = 1080;

    const [targets, setTargets] = useState<Array<HTMLElement | SVGElement>>([]);
    const moveableRef = useRef<Moveable>(null);

    // 手動DOM更新用
    const activeStatesRef = useRef<Map<string, ActiveState>>(new Map());

    // Moveable の位置状態をストアに同期するヘルパー
    const syncMoveableRect = useCallback(() => {
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
    }, [setActiveMoveableRect]);


    // 共通のクランプ処理 (Arrow nudging と Moveable 両方で使用)
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

    // 画面リサイズ監視 & Arrow Key Nudging
    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            setViewSize({ w, h });

            // リサイズ時に各ウィジェットの activeState (posX, posY, scale) を再計算
            // これを行わないと、リサイズ後にドラッグを開始した瞬間に古い座標系でジャンプする
            activeStatesRef.current.forEach((state, id) => {
                const s = useWidgetStore.getState().widgetStates[id as WidgetId];
                if (s) {
                    const scalingFactor = Math.min(w / SCALING_BASE_W, h / SCALING_BASE_H);
                    state.posX = s.px * w;
                    state.posY = s.py * h;
                    state.scale = s.scale * scalingFactor;
                }
            });

            // リサイズ時に Moveable の枠とアクションバーを強制同期
            if (moveableRef.current) {
                moveableRef.current.updateRect();
                syncMoveableRect();
            }
        };

        window.addEventListener('resize', handleResize);

        // ウィジェット要素自体のサイズ変更も監視（Moveableの枠ズレ対策）
        const resizeObserver = new ResizeObserver(() => {
            if (moveableRef.current) {
                moveableRef.current.updateRect();
                syncMoveableRect();
            }
        });

        targets.forEach(t => resizeObserver.observe(t));

        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedWidgetIds.length === 0) return;
            if (document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA' ||
                (document.activeElement as HTMLElement)?.isContentEditable) {
                return;
            }

            const isArrow = e.key.startsWith('Arrow');
            if (!isArrow) return;

            e.preventDefault();

            const moveStep = e.shiftKey ? 10 : 1;
            const dx = e.key === 'ArrowLeft' ? -moveStep : e.key === 'ArrowRight' ? moveStep : 0;
            const dy = e.key === 'ArrowUp' ? -moveStep : e.key === 'ArrowDown' ? moveStep : 0;

            if (dx === 0 && dy === 0) return;

            // 現在の全メンバーの状態を取得して試算
            const allMemberIds = new Set<string>();
            selectedWidgetIds.forEach(id => {
                const group = groupData.groups.find(g => g.id === id);
                if (group) group.memberIds.forEach(mid => allMemberIds.add(mid));
                else allMemberIds.add(id);
            });

            const items = Array.from(allMemberIds).map(id => {
                const s = useWidgetStore.getState().widgetStates[id as WidgetId] || { px: 0, py: 0, scale: 1, rotation: 0 };
                const el = document.querySelector(`[data-widget-id="${id}"]`) as HTMLElement;
                if (!el) return null;
                return {
                    id,
                    state: {
                        ...s,
                        posX: s.px * window.innerWidth,
                        posY: s.py * window.innerHeight,
                        width: el.offsetWidth,
                        height: el.offsetHeight
                    },
                    el
                };
            }).filter((i): i is NonNullable<typeof i> => i !== null);

            if (items.length === 0) return;

            // 全体で共通の移動制限を計算 (フォーメーション維持)
            const finalDelta = [dx, dy];
            items.forEach(({ state, el }) => {
                const sw = el.offsetWidth * state.scale;
                const sh = el.offsetHeight * state.scale;
                const margin = Math.min(40, sw * 0.5, sh * 0.5);
                const halfW = window.innerWidth / 2;
                const halfH = window.innerHeight / 2;

                const minX = -halfW - sw / 2 + margin;
                const maxX = halfW + sw / 2 - margin;
                const minY = -halfH - sh / 2 + margin;
                const maxY = halfH + sh / 2 - margin;

                if (finalDelta[0] > 0) finalDelta[0] = Math.max(0, Math.min(finalDelta[0], maxX - state.posX));
                else if (finalDelta[0] < 0) finalDelta[0] = Math.min(0, Math.max(finalDelta[0], minX - state.posX));

                if (finalDelta[1] > 0) finalDelta[1] = Math.max(0, Math.min(finalDelta[1], maxY - state.posY));
                else if (finalDelta[1] < 0) finalDelta[1] = Math.min(0, Math.max(finalDelta[1], minY - state.posY));
            });

            // ストアを更新
            items.forEach(({ id, state }) => {
                updateWidgetState(id as WidgetId, {
                    px: (state.posX + finalDelta[0]) / window.innerWidth,
                    py: (state.posY + finalDelta[1]) / window.innerHeight,
                });
            });

            // Moveable の枠を追従させる
            requestAnimationFrame(() => {
                if (moveableRef.current) {
                    moveableRef.current.updateRect();
                    const rect = moveableRef.current.getRect();
                    setActiveMoveableRect({
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                        rotation: rect.rotation,
                    });
                }
            });
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
        };
    }, [selectedWidgetIds, viewSize, targets, updateWidgetState, setActiveMoveableRect, setIsTransforming, syncMoveableRect]);

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
            const scalingFactor = Math.min(viewSize.w / SCALING_BASE_W, viewSize.h / SCALING_BASE_H);
            activeStatesRef.current.set(id, {
                ...s,
                posX: s.px * viewSize.w,
                posY: s.py * viewSize.h,
                scale: s.scale * scalingFactor, // 表示上のサイズ
                width: el.offsetWidth,
                height: el.offsetHeight,
            });
        }
        setIsTransforming(true);
    };

    const endAction = (ids: string[]) => {
        ids.forEach(id => {
            const state = activeStatesRef.current.get(id);
            if (state) {
                // 回転を [-180, 180] に正規化
                let rot = state.rotation % 360;
                if (rot > 180) rot -= 360;
                if (rot < -180) rot += 360;

                const scalingFactor = Math.min(viewSize.w / SCALING_BASE_W, viewSize.h / SCALING_BASE_H);

                updateWidgetState(id as WidgetId, {
                    px: state.posX / viewSize.w,
                    py: state.posY / viewSize.h,
                    scale: state.scale / scalingFactor, // 基準サイズ（1920px時）に戻して保存
                    rotation: rot,
                });
                activeStatesRef.current.delete(id);
            }
        });
    };

    // --- Handlers ---
    const handleDragStart = useCallback((e: OnDragStart) => {
        const id = e.target.getAttribute('data-widget-id');
        startAction(id);
        const state = activeStatesRef.current.get(id || '');
        if (state) e.set([state.posX, state.posY]);
    }, [viewSize]);
    const handleDrag = useCallback(({ target, beforeDelta }: OnDrag) => {
        const id = target.getAttribute('data-widget-id');
        const state = activeStatesRef.current.get(id || '');
        if (!id || !state) return;
        state.posX += beforeDelta[0];
        state.posY += beforeDelta[1];
        clampState(state);
        updateDOMTransform(target as HTMLElement, state);
        syncMoveableRect();
    }, [viewSize.w, viewSize.h, syncMoveableRect]);

    const handleScaleStart = useCallback((e: OnScaleStart) => {
        const id = e.target.getAttribute('data-widget-id');
        startAction(id);
        const state = activeStatesRef.current.get(id || '');
        if (state) {
            e.set(e.dragStart ? [state.scale, state.scale] : [state.scale]);
            if (e.dragStart) e.dragStart.set([state.posX, state.posY]);
        }
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
        clampState(state);
        updateDOMTransform(target as HTMLElement, state);
        syncMoveableRect();
    }, [viewSize.w, viewSize.h, syncMoveableRect]);

    const handleRotateStart = useCallback((e: OnRotateStart) => {
        const id = e.target.getAttribute('data-widget-id');
        startAction(id);
        const state = activeStatesRef.current.get(id || '');
        if (state) {
            e.set(state.rotation);
            if (e.dragStart) e.dragStart.set([state.posX, state.posY]);
        }
    }, [viewSize]);
    const handleRotate = useCallback(({ target, rotate, drag }: OnRotate) => {
        const id = target.getAttribute('data-widget-id');
        const state = activeStatesRef.current.get(id || '');
        if (!id || !state) return;
        state.rotation = rotate;
        if (drag) {
            state.posX += drag.beforeDelta[0];
            state.posY += drag.beforeDelta[1];
        }
        clampState(state);
        updateDOMTransform(target as HTMLElement, state);
        syncMoveableRect();
    }, [viewSize.w, viewSize.h, syncMoveableRect]);

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
        setIsTransforming(false);
    }, [setActiveMoveableRect, setIsTransforming, viewSize]);

    // Group handlers
    const handleDragGroupStart = useCallback(({ events }: OnDragGroupStart) => {
        events.forEach(e => {
            const id = e.target.getAttribute('data-widget-id');
            startAction(id);
            const state = activeStatesRef.current.get(id || '');
            if (state) e.set([state.posX, state.posY]);
        });
    }, [viewSize]);

    const handleScaleGroupStart = useCallback(({ events }: OnScaleGroupStart) => {
        events.forEach(e => {
            const id = e.target.getAttribute('data-widget-id');
            startAction(id);
            const state = activeStatesRef.current.get(id || '');
            if (state) {
                e.set([state.scale, state.scale]);
                if (e.dragStart) e.dragStart.set([state.posX, state.posY]);
            }
        });
    }, [viewSize]);

    const handleRotateGroupStart = useCallback(({ events }: OnRotateGroupStart) => {
        events.forEach(e => {
            const id = e.target.getAttribute('data-widget-id');
            startAction(id);
            const state = activeStatesRef.current.get(id || '');
            if (state) {
                e.set(state.rotation);
                if (e.dragStart) e.dragStart.set([state.posX, state.posY]);
            }
        });
    }, [viewSize]);

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

                onRotateStart={(e) => {
                    handleRotateStart(e);
                }}
                onRotate={handleRotate}
                onRotateEnd={() => {
                    handleEnd();
                }}

                onDragGroupStart={(e) => { handleDragGroupStart(e); }}
                onDragGroup={({ events }) => {
                    events.forEach(e => {
                        const id = e.target.getAttribute('data-widget-id') || '';
                        const state = activeStatesRef.current.get(id);
                        if (state) {
                            state.posX += e.beforeDelta[0];
                            state.posY += e.beforeDelta[1];
                            updateDOMTransform(e.target as HTMLElement, state);
                        }
                    });
                    syncMoveableRect();
                }}
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
                onScaleGroup={({ events }) => {
                    const activeItems = events.map(e => ({
                        e,
                        state: activeStatesRef.current.get(e.target.getAttribute('data-widget-id') || '')
                    })).filter((x): x is { e: any, state: ActiveState } => !!x.state);

                    if (activeItems.length > 0) {
                        // 1. 各要素の移動・拡縮後の「試算」
                        const trials = activeItems.map(({ e, state }) => {
                            const trialX = state.posX + (e.drag?.delta[0] || 0);
                            const trialY = state.posY + (e.drag?.delta[1] || 0);
                            return { e, state, trialX, trialY, scale: e.scale[0] };
                        });

                        // 2. 共通の補正量（位置関係を保つための全体スライド量）を計算
                        let offsetX = 0;
                        let offsetY = 0;
                        trials.forEach(t => {
                            const sw = t.state.width * t.scale;
                            const sh = t.state.height * t.scale;
                            const margin = Math.min(40, sw * 0.5, sh * 0.5);
                            const halfW = window.innerWidth / 2;
                            const halfH = window.innerHeight / 2;
                            const minX = -halfW - sw / 2 + margin;
                            const maxX = halfW + sw / 2 - margin;
                            const minY = -halfH - sh / 2 + margin;
                            const maxY = halfH + sh / 2 - margin;

                            if (t.trialX < minX) offsetX = Math.max(offsetX, minX - t.trialX);
                            if (t.trialX > maxX) offsetX = Math.min(offsetX, maxX - t.trialX);
                            if (t.trialY < minY) offsetY = Math.max(offsetY, minY - t.trialY);
                            if (t.trialY > maxY) offsetY = Math.min(offsetY, maxY - t.trialY);
                        });

                        // 3. 適用。共通補正を入れてもはみ出す場合は最後のみ個別クランプ（崩れを最小限に）
                        trials.forEach(t => {
                            t.state.scale = t.scale;
                            t.state.posX = t.trialX + offsetX;
                            t.state.posY = t.trialY + offsetY;
                            clampState(t.state);
                            updateDOMTransform(t.e.target as HTMLElement, t.state);
                        });
                    }
                }}
                onScaleGroupEnd={() => { handleEnd(); }}

                onRotateGroupStart={(e) => {
                    handleRotateGroupStart(e);
                }}
                onRotateGroup={({ events }) => {
                    const activeItems = events.map(e => ({
                        e,
                        state: activeStatesRef.current.get(e.target.getAttribute('data-widget-id') || '')
                    })).filter((x): x is { e: any, state: ActiveState } => !!x.state);

                    if (activeItems.length > 0) {
                        const trials = activeItems.map(({ e, state }) => {
                            const trialX = state.posX + (e.drag?.delta[0] || 0);
                            const trialY = state.posY + (e.drag?.delta[1] || 0);
                            return { e, state, trialX, trialY, rotation: e.rotate };
                        });

                        let offsetX = 0;
                        let offsetY = 0;
                        trials.forEach(t => {
                            const sw = t.state.width * t.state.scale;
                            const sh = t.state.height * t.state.scale;
                            const margin = Math.min(40, sw * 0.5, sh * 0.5);
                            const halfW = window.innerWidth / 2;
                            const halfH = window.innerHeight / 2;
                            const minX = -halfW - sw / 2 + margin;
                            const maxX = halfW + sw / 2 - margin;
                            const minY = -halfH - sh / 2 + margin;
                            const maxY = halfH + sh / 2 - margin;

                            if (t.trialX < minX) offsetX = Math.max(offsetX, minX - t.trialX);
                            if (t.trialX > maxX) offsetX = Math.min(offsetX, maxX - t.trialX);
                            if (t.trialY < minY) offsetY = Math.max(offsetY, minY - t.trialY);
                            if (t.trialY > maxY) offsetY = Math.min(offsetY, maxY - t.trialY);
                        });

                        trials.forEach(t => {
                            t.state.rotation = t.rotation;
                            t.state.posX = t.trialX + offsetX;
                            t.state.posY = t.trialY + offsetY;
                            // グループ回転での累積誤差を防ぐため、beforeDelta ではなく e.drag.beforeDelta を使う手法もあるが、
                            // react-moveable の trial 値をそのまま適用
                            clampState(t.state);
                            updateDOMTransform(t.e.target as HTMLElement, t.state);
                        });
                    }
                }}
                onRotateGroupEnd={() => {
                    handleEnd();
                }}

                onRender={syncMoveableRect}
                onRenderGroup={syncMoveableRect}
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
