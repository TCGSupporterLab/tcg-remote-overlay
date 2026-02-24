import React from 'react';
import { useWidgetStore } from '../store/useWidgetStore';
import { Layers, Ungroup, X } from 'lucide-react';

export const SelectionActionBar: React.FC = () => {
    const selectedWidgetIds = useWidgetStore(s => s.selectedWidgetIds);
    const groups = useWidgetStore(s => s.groupData.groups);
    const activeMoveableRect = useWidgetStore(s => s.activeMoveableRect);
    const setSelectedWidgets = useWidgetStore(s => s.setSelectedWidgets);
    const groupSelectedWidgets = useWidgetStore(s => s.groupSelectedWidgets);
    const ungroupSelectedWidgets = useWidgetStore(s => s.ungroupSelectedWidgets);

    if (selectedWidgetIds.length < 2) return null;

    // 選択中のアイテムがグループに属しているかチェック
    const hasGroup = selectedWidgetIds.some(id =>
        groups.some(g => g.id === id || g.memberIds.includes(id))
    );

    // 配置位置の計算
    const style: React.CSSProperties = activeMoveableRect
        ? (() => {
            const rect = activeMoveableRect;
            const barHeight = 56; // 概算の高さ
            const gap = 12;

            // 回転角度の正規化 (0-360)
            const normRotation = ((rect.rotation % 360) + 360) % 360;
            // ハンドルが「下側」に来る角度か判定（180度付近）
            const isHandleAtBottom = normRotation > 90 && normRotation < 270;

            // デフォルトはハンドルの反対側
            let useTop = isHandleAtBottom;

            // 画面外チェック
            const spaceAtBottom = window.innerHeight - (rect.top + rect.height + gap + barHeight);
            const spaceAtTop = rect.top - gap - barHeight;

            if (useTop && spaceAtTop < 0 && spaceAtBottom > spaceAtTop) {
                // 上に置きたいが上が狭く、下の方が広い場合は下に切り替え
                useTop = false;
            } else if (!useTop && spaceAtBottom < 0 && spaceAtTop > spaceAtBottom) {
                // 下に置きたいが下が狭く、上の方が広い場合は上に切り替え
                useTop = true;
            }

            let topPos = useTop
                ? rect.top - gap - barHeight
                : rect.top + rect.height + gap;

            // 最終ガード: 画面内に収める
            topPos = Math.max(gap, Math.min(window.innerHeight - barHeight - gap, topPos));

            // 左右もはみ出さないようにガード（概算幅240px）
            const halfWidth = 120;
            let leftPos = rect.left + rect.width / 2;
            leftPos = Math.max(halfWidth + gap, Math.min(window.innerWidth - halfWidth - gap, leftPos));

            return {
                position: 'fixed' as const,
                left: `${leftPos}px`,
                top: `${topPos}px`,
                transform: 'translateX(-50%)',
            };
        })()
        : {
            position: 'fixed',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
        };

    return (
        <div
            style={style}
            className="selection-action-bar z-[1000] animate-in fade-in zoom-in-95 duration-200"
        >
            <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-2 flex items-center gap-2 shadow-2xl ring-1 ring-white/10">
                <div className="px-4 py-1 flex flex-col pointer-events-none border-r border-white/10 mr-1">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Selection</span>
                    <span className="text-white font-mono text-sm leading-none tabular-nums">
                        {selectedWidgetIds.length} <span className="text-[10px] text-white/60">items</span>
                    </span>
                </div>

                <div className="flex items-center gap-1.5 p-1">
                    <button
                        onClick={() => groupSelectedWidgets()}
                        className="group flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-xl transition-all duration-200 active:scale-95"
                        title="結合 (G)"
                    >
                        <Layers size={18} className="group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold tracking-tight">結合</span>
                    </button>

                    {hasGroup && (
                        <button
                            onClick={() => ungroupSelectedWidgets()}
                            className="group flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-xl transition-all duration-200 active:scale-95"
                            title="解除"
                        >
                            <Ungroup size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold tracking-tight">解除</span>
                        </button>
                    )}

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    <button
                        onClick={() => setSelectedWidgets([])}
                        className="p-2 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-colors active:scale-90"
                        title="選択解除"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
