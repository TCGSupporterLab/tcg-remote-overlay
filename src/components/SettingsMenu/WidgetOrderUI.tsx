import { useState } from 'react';
import { GripVertical, Dices, Coins, Heart, Sparkles, RectangleVertical } from 'lucide-react';
import { type WidgetId } from '../../types/widgetTypes';
import { useWidgetStore } from '../../store/useWidgetStore';

interface OrderItem {
    id: WidgetId;
    label: string;
    isVisible: boolean;
    icon: React.ReactNode;
}

const WIDGET_INFO: Record<WidgetId, { label: string, icon: React.ReactNode }> = {
    dice: { label: 'ダイス', icon: <Dices size={16} /> },
    coin: { label: 'コイン', icon: <Coins size={16} /> },
    lp_calculator: { label: 'ライフポイント', icon: <Heart size={16} /> },
    card_widget: { label: 'カード', icon: <RectangleVertical size={16} /> },
    sp_marker: { label: 'SPマーカー', icon: <Sparkles size={16} /> },
};

export const WidgetOrderUI = () => {
    const widgetOrder = useWidgetStore(s => s.widgetOrder);
    const visibility = useWidgetStore(s => s.visibility);
    const reorderWidgets = useWidgetStore(s => s.reorderWidgets);

    const [draggingId, setDraggingId] = useState<WidgetId | null>(null);

    // 表示中のウィジェットのみをフィルタリングして現在の順序で並べる
    const visibleItems: OrderItem[] = widgetOrder
        .map(id => {
            let isVisible = false;
            if (id === 'dice') isVisible = visibility.isDiceVisible;
            if (id === 'coin') isVisible = visibility.isCoinVisible;
            if (id === 'lp_calculator') isVisible = visibility.isLPVisible;
            if (id === 'card_widget') isVisible = visibility.isCardWidgetVisible;
            if (id === 'sp_marker') isVisible = visibility.isSPMarkerVisible;

            const info = WIDGET_INFO[id] || { label: id, icon: null };
            return { id, label: info.label, icon: info.icon, isVisible };
        })
        .filter(item => item.isVisible);

    if (visibleItems.length === 0) {
        return (
            <div className="text-xs text-gray-500 bg-black/40 p-[12px] rounded-lg border border-white/10 flex items-center justify-center">
                現在表示中のウィジェットはありません
            </div>
        );
    }

    return (
        <div className="space-y-[2px]">
            {visibleItems.map((item) => (
                <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                        setDraggingId(item.id);
                        e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        if (draggingId && draggingId !== item.id) {
                            reorderWidgets(draggingId, item.id);
                        }
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={`flex items-center gap-[8px] p-[4px] px-[10px] bg-white/5 rounded-lg border transition-all ${draggingId === item.id
                        ? 'opacity-40 border-blue-500/50 bg-blue-500/5 shadow-inner'
                        : 'border-white/5 hover:border-white/20 hover:bg-white/10'
                        }`}
                >
                    <div className="cursor-grab active:cursor-grabbing p-[2px] text-gray-500 hover:text-gray-300 transition-colors">
                        <GripVertical size={14} />
                    </div>

                    <div className="flex-1 flex items-center gap-[10px]">
                        <div className="text-gray-400 group-hover:text-secondary opacity-70 transition-colors scale-90">
                            {item.icon}
                        </div>
                        <span className="text-[13px] font-medium text-gray-200">{item.label}</span>
                    </div>

                </div>
            ))}

            <div className="mt-[6px] p-[6px] rounded-lg bg-blue-500/5 border border-blue-500/10">
                <p className="text-[9px] text-blue-400/80 leading-relaxed">
                    ※ 上にあるものほど前面に表示されます。ドラッグして順序を入れ替えてください。
                </p>
            </div>
        </div>
    );
};
