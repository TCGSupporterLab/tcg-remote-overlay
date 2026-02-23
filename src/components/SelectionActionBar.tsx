import React from 'react';
import { Link, Unlink, X } from 'lucide-react';

interface SelectionActionBarProps {
    selectedCount: number;
    hasGroupedSelection: boolean;
    onGroup: () => void;
    onUngroup: () => void;
    onClearSelection: () => void;
}

export const SelectionActionBar: React.FC<SelectionActionBarProps> = ({
    selectedCount,
    hasGroupedSelection,
    onGroup,
    onUngroup,
    onClearSelection,
}) => {
    if (selectedCount < 1) return null;

    return (
        <div
            className="fixed bottom-[32px] left-1/2 -translate-x-1/2 z-[500] pointer-events-auto
        flex items-center gap-[12px] px-[20px] py-[12px]
        bg-[#0d0f1a]/90 backdrop-blur-xl border border-white/15
        rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)]
        animate-in slide-in-from-bottom-4 fade-in duration-300"
        >
            <span className="text-[13px] text-gray-300 font-bold whitespace-nowrap">
                {selectedCount} 個選択中
            </span>

            <div className="w-px h-[20px] bg-white/10" />

            {selectedCount >= 2 && (
                <button
                    onClick={onGroup}
                    className="flex items-center gap-[6px] px-[16px] py-[8px] bg-blue-600/80 hover:bg-blue-500 text-white text-[13px] font-bold rounded-full transition-all hover:scale-105 active:scale-95"
                    title="選択中のウィジェットを結合 (G)"
                >
                    <Link size={15} />
                    結合
                </button>
            )}

            {hasGroupedSelection && (
                <button
                    onClick={onUngroup}
                    className="flex items-center gap-[6px] px-[16px] py-[8px] bg-orange-600/80 hover:bg-orange-500 text-white text-[13px] font-bold rounded-full transition-all hover:scale-105 active:scale-95"
                    title="選択中のグループを解除"
                >
                    <Unlink size={15} />
                    解除
                </button>
            )}

            <button
                onClick={onClearSelection}
                className="flex items-center gap-[6px] px-[12px] py-[8px] bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white text-[13px] font-bold rounded-full transition-all border border-white/10"
                title="選択を解除 (Escape)"
            >
                <X size={15} />
            </button>
        </div>
    );
};
