import React from 'react';
import { useWidgetStore } from '../store/useWidgetStore';
import { Link, Unlink, Undo2, Save } from 'lucide-react';

export const SelectionActionBar: React.FC = () => {
    const selectedWidgetIds = useWidgetStore(s => s.selectedWidgetIds);
    const groups = useWidgetStore(s => s.groupData.groups);
    const activeMoveableRect = useWidgetStore(s => s.activeMoveableRect);
    const groupSelectedWidgets = useWidgetStore(s => s.groupSelectedWidgets);
    const ungroupSelectedWidgets = useWidgetStore(s => s.ungroupSelectedWidgets);
    const resetWidgets = useWidgetStore(s => s.resetWidgets);
    const isTransforming = useWidgetStore(s => s.isTransforming);
    const setIsTransforming = useWidgetStore(s => s.setIsTransforming);
    const saveLayout = useWidgetStore(s => s.saveLayout);

    if (selectedWidgetIds.length < 1 || isTransforming) return null;

    // 選択中のアイテムがグループに属しているかチェック
    const hasGroup = selectedWidgetIds.some(id =>
        groups.some(g => g.id === id || g.memberIds.includes(id))
    );

    // 配置位置の計算
    const style: React.CSSProperties = activeMoveableRect
        ? (() => {
            const rect = activeMoveableRect;
            const barHeight = 44;
            const internalGap = 12; // ウィジェット「内側」の余白

            // 回転ハンドル（上部）の位置を考慮
            const normRotation = ((rect.rotation % 360) + 360) % 360;
            const isHandleAtBottom = normRotation > 90 && normRotation < 270;

            // 原則、ハンドルの反対側に置くが、ユーザーの要望により「下側」を優先
            // ハンドルが下にある時だけ上に逃げる（重なり回避）
            const useTop = isHandleAtBottom;

            // 選んだ側の「内側」の理想的なY座標
            let topPos = useTop
                ? rect.top + internalGap
                : rect.top + rect.height - barHeight - internalGap;

            // 画面外対策：フリップ（入れ替え）ではなく、表示可能な範囲に押し戻す
            const screenMargin = 16;
            topPos = Math.max(
                screenMargin,
                Math.min(window.innerHeight - barHeight - screenMargin, topPos)
            );

            // 左右の画面外対策：バー全体が画面内に収まるように中央位置をクランプ
            const hasMultiple = selectedWidgetIds.length > 1;
            const barIconsCount = 1 + (hasMultiple ? (hasGroup ? 2 : 1) : 0);
            const approximateBarWidth = barIconsCount * 44 + 8; // アイコン数 * (ボタンサイズ+間隔) + パディング
            const halfWidth = approximateBarWidth / 2;
            const horizontalMargin = 16;
            let leftPos = rect.left + rect.width / 2;
            leftPos = Math.max(
                halfWidth + horizontalMargin,
                Math.min(window.innerWidth - halfWidth - horizontalMargin, leftPos)
            );

            return {
                position: 'fixed' as const,
                left: 0,
                top: 0,
                transform: `translate3d(${leftPos}px, ${topPos}px, 0) translateX(-50%)`,
                willChange: 'transform',
                transition: 'none',
            };
        })()
        : {
            position: 'fixed' as const,
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
        };

    return (
        <div
            style={style}
            className="selection-action-bar z-[1000] animate-in fade-in duration-300"
        >
            <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-1 flex items-center shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center gap-1 p-1">
                    <button
                        onClick={() => {
                            const name = window.prompt('レイアウト名を入力してください');
                            if (name) saveLayout(name);
                        }}
                        className="group p-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center"
                        title="マイレイアウトに追加"
                    >
                        <Save size={18} className="group-hover:scale-110 transition-transform" />
                    </button>

                    <div className="w-px h-5 bg-white/10 mx-1" />

                    <button
                        onClick={() => {
                            // 選択されているすべてのウィジェット（単体・グループ問わず）をリセット
                            setIsTransforming(true);
                            resetWidgets(selectedWidgetIds);
                        }}
                        className="group p-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center"
                        title="リセット"
                    >
                        <Undo2 size={18} className="group-hover:scale-110 group-hover:-translate-x-0.5 transition-transform" />
                    </button>

                    {selectedWidgetIds.length > 1 && (
                        <>
                            <div className="w-px h-5 bg-white/10 mx-1" />
                            <button
                                onClick={() => groupSelectedWidgets()}
                                className="group p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center"
                                title="グループ化"
                            >
                                <Link size={18} className="group-hover:scale-110 transition-transform" />
                            </button>

                            {hasGroup && (
                                <>
                                    <div className="w-px h-5 bg-white/10 mx-1" />
                                    <button
                                        onClick={() => ungroupSelectedWidgets()}
                                        className="group p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center"
                                        title="グループ解除"
                                    >
                                        <Unlink size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
