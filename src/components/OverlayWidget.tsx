import React, { useEffect, useRef } from 'react';
import type { WidgetId } from '../types/widgetTypes';
import { useWidgetStore } from '../store/useWidgetStore';

interface OverlayWidgetProps {
    children: React.ReactNode;
    widgetId: string;
    instanceId?: WidgetId;
    isSelected?: boolean;
    isGrouped?: boolean;
    /** Ref callback to register this widget's container element for rect selection */
    containerRefCallback?: (id: WidgetId, el: HTMLDivElement | null) => void;
}

const DEFAULT_WIDGET_STATE = { px: 0, py: 0, scale: 1, rotation: 0 };

export const OverlayWidget: React.FC<OverlayWidgetProps> = ({
    children,
    widgetId,
    instanceId,
    containerRefCallback,
}) => {
    const id = instanceId || widgetId;
    const widgetIdTyped = id as WidgetId;

    // Zustand Store から状態を取得
    const state = useWidgetStore(s => s.widgetStates[id] || DEFAULT_WIDGET_STATE);
    const viewSize = useWidgetStore(s => s.viewSize);
    const widgetOrder = useWidgetStore(s => s.widgetOrder);
    const selectedWidgetIds = useWidgetStore(s => s.selectedWidgetIds);

    // 仕様に基づいた zIndex の計算
    // 前面ほどインデックスが小さいマスターリスト widgetOrder を基準にする
    const orderIndex = widgetOrder.indexOf(widgetIdTyped);
    const priority = orderIndex === -1 ? 999 : orderIndex; // リストにない場合は背面へ
    const invertPriority = 100 - priority; // 数値が大きいほど前面に来るように反転 (0-100)

    const isSelectedInStore = selectedWidgetIds.includes(widgetIdTyped);

    // レイヤー決定
    let finalZIndex = 500 + invertPriority; // 標準レイヤー (500-600)

    if (isSelectedInStore) {
        finalZIndex = 1000 + invertPriority; // 最前面レイヤー (1000-1100)
    }

    // ウィンドウサイズに応じたスケーリング係数 (基準: 1920x1080)
    const scalingFactor = Math.min(viewSize.w / 1920, viewSize.h / 1080);

    const containerRef = useRef<HTMLDivElement>(null);

    // Register container ref for rect selection / Moveable targets
    useEffect(() => {
        if (containerRefCallback) {
            containerRefCallback(widgetIdTyped, containerRef.current);
            return () => containerRefCallback(widgetIdTyped, null);
        }
    }, [containerRefCallback, widgetIdTyped]);
    return (
        <div
            className="fixed inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: finalZIndex }}
        >
            <div
                ref={containerRef}
                data-widget-id={id}
                className="absolute pointer-events-auto select-none"
                style={{
                    left: '50%',
                    top: '50%',
                    // 座標、拡縮、回転を一箇所に集約。translate(-50%, -50%) で中心を基準に合わせる
                    transform: `translate(${state.px * 100}vw, ${state.py * 100}vh) translate(-50%, -50%) scale(${state.scale * scalingFactor}) rotate(${state.rotation}deg)`,
                    transformOrigin: 'center center',
                }}
                // マルチ選択（Ctrl+クリック）時、または選択済み状態でクリックされた場合に
                // ウィジェット内のボタン等が反応しないようにキャプチャフェーズで阻止
                onClickCapture={(e) => {
                    if (e.ctrlKey || e.metaKey || isSelectedInStore) {
                        e.stopPropagation();
                    }
                }}
            >
                {children}
            </div>
        </div>
    );
};
