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
    isSelected = false,
    isGrouped = false,
    containerRefCallback,
}) => {
    const id = instanceId || widgetId;

    // Zustand Store から状態を取得
    const state = useWidgetStore(s => s.widgetStates[id] || DEFAULT_WIDGET_STATE);

    const containerRef = useRef<HTMLDivElement>(null);

    // Register container ref for rect selection / Moveable targets
    useEffect(() => {
        if (containerRefCallback) {
            containerRefCallback(id as WidgetId, containerRef.current);
            return () => containerRefCallback(id as WidgetId, null);
        }
    }, [containerRefCallback, id]);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div
                ref={containerRef}
                data-widget-id={id}
                className="absolute pointer-events-auto select-none"
                style={{
                    left: '50%',
                    top: '50%',
                    // 座標、拡縮、回転を一箇所に集約。translate(-50%, -50%) で中心を基準に合わせる
                    transform: `translate(${state.px * 100}vw, ${state.py * 100}vh) translate(-50%, -50%) scale(${state.scale}) rotate(${state.rotation}deg)`,
                    transformOrigin: 'center center',
                    zIndex: 100,
                }}
                // マルチ選択（Ctrl+クリック）時にウィジェット内のボタン等が反応しないようにキャプチャフェーズで阻止
                onClickCapture={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                        e.stopPropagation();
                    }
                }}
            >
                {children}
                {/* Selection highlight */}
                {isSelected && !isGrouped && (
                    <div
                        className="absolute inset-[-4px] border-2 border-blue-400 rounded-lg pointer-events-none"
                        style={{ boxShadow: '0 0 12px rgba(96, 165, 250, 0.4)' }}
                    />
                )}
            </div>
        </div>
    );
};
