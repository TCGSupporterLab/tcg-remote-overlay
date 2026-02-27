import React, { useState, useEffect } from 'react';
import { X, Save, Layers, Video, EyeOff } from 'lucide-react';

interface SaveLayoutDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, options: { includeWidgets: boolean, includeVideo: boolean, hideOthers: boolean }) => void;
    initialOptions?: {
        includeWidgets: boolean;
        includeVideo: boolean;
        hideOthers: boolean;
    };
    source: 'action-bar' | 'video-menu' | 'settings';
}

export const SaveLayoutDialog = ({ isOpen, onClose, onSave, initialOptions, source }: SaveLayoutDialogProps) => {
    const [name, setName] = useState('');
    const [includeWidgets, setIncludeWidgets] = useState(initialOptions?.includeWidgets ?? true);
    const [includeVideo, setIncludeVideo] = useState(initialOptions?.includeVideo ?? false);
    const [hideOthers, setHideOthers] = useState(initialOptions?.hideOthers ?? false);

    useEffect(() => {
        if (isOpen && initialOptions) {
            setIncludeWidgets(initialOptions.includeWidgets);
            setIncludeVideo(initialOptions.includeVideo);
            setHideOthers(initialOptions.hideOthers);
            setName('');
        }
    }, [isOpen, initialOptions]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!name.trim()) return;
        onSave(name.trim(), { includeWidgets, includeVideo, hideOthers });
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-[#0f172a] border-2 border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-[400px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-xl text-blue-400">
                            <Save size={20} />
                        </div>
                        <h2 className="font-bold text-lg text-white">レイアウトを保存</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 ml-1">レイアウト名</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="例: 対戦用メイン、検証用1 など"
                            autoFocus
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                        />
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 ml-1">保存対象</label>

                        {/* Widgets Toggle */}
                        <div
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${includeWidgets ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/5 border-white/5 opacity-60'}`}
                            onClick={() => setIncludeWidgets(!includeWidgets)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${includeWidgets ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                                    <Layers size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">ウィジェット</p>
                                    <p className="text-[10px] text-gray-500">
                                        {source === 'action-bar' ? '選択中の配置' : 'すべての表示状態'}
                                    </p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={includeWidgets}
                                readOnly
                                className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-offset-0"
                            />
                        </div>

                        {/* Video Toggle */}
                        <div
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${includeVideo ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/5 border-white/5 opacity-60'}`}
                            onClick={() => setIncludeVideo(!includeVideo)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${includeVideo ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                                    <Video size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">映像調整</p>
                                    <p className="text-[10px] text-gray-500">ズーム、位置、反転等</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={includeVideo}
                                readOnly
                                className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-offset-0"
                            />
                        </div>
                    </div>

                    {/* Behavior */}
                    <div className="space-y-3 pt-2">
                        <label className="text-xs font-bold text-gray-400 ml-1">適用時の挙動</label>
                        <div
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${hideOthers ? 'bg-purple-600/10 border-purple-500/30' : 'bg-white/5 border-white/5 opacity-60'}`}
                            onClick={() => setHideOthers(!hideOthers)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${hideOthers ? 'bg-purple-600/20 text-purple-400' : 'bg-gray-800 text-gray-500'}`}>
                                    <EyeOff size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">他を隠す</p>
                                    <p className="text-[10px] text-gray-500">保存時以外のものを非表示にする</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={hideOthers}
                                readOnly
                                className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-offset-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 bg-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-all text-sm"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="flex-[2] py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all text-sm"
                    >
                        保存する
                    </button>
                </div>
            </div>
        </div>
    );
};
