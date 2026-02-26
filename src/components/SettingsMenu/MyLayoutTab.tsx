import { Layout, Play, Download, Upload, Trash2, Save, Layers, Video } from 'lucide-react';
import { useWidgetStore } from '../../store/useWidgetStore';

interface MyLayoutTabProps {
    onOpenSaveDialog: (source: 'settings', initialOptions?: { includeWidgets: boolean, includeVideo: boolean, hideOthers: boolean }) => void;
}

export const MyLayoutTab = ({ onOpenSaveDialog }: MyLayoutTabProps) => {
    const myLayouts = useWidgetStore(s => s.myLayouts);
    const applyLayout = useWidgetStore(s => s.applyLayout);
    const deleteLayout = useWidgetStore(s => s.deleteLayout);
    const importLayout = useWidgetStore(s => s.importLayout);

    const handleExport = (id: string) => {
        const layout = myLayouts.find(l => l.id === id);
        if (!layout) return;

        const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${layout.name}_layout.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (re) => {
                try {
                    const data = JSON.parse(re.target?.result as string);
                    const result = importLayout(data);
                    if (!result.success) {
                        alert(result.message);
                    }
                } catch (err) {
                    alert('ファイルの読み込みに失敗しました。');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    return (
        <div className="space-y-[24px] pb-[20px]">
            {/* 新規保存ボタン */}
            <section className="space-y-[12px]">
                <h3 className="text-lg font-bold mb-[8px] flex items-center gap-[6px] border-b border-white/10 pb-[8px]">
                    <Layout size={18} className="text-secondary" />
                    マイレイアウト
                </h3>
                <div className="p-[16px] rounded-2xl bg-white/5 border border-white/10 space-y-[8px]">
                    <h3 className="text-sm font-bold text-white">現在の状態を保存</h3>
                    <p className="text-[11px] text-gray-400">表示中のすべての配置と映像設定をレイアウトとして記録します。</p>
                    <button
                        onClick={() => onOpenSaveDialog('settings', { includeWidgets: true, includeVideo: true, hideOthers: true })}
                        className="w-full py-[12px] px-[16px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 text-sm"
                    >
                        <Save size={18} />
                        新規レイアウトとして保存
                    </button>
                </div>
            </section>

            {/* レイアウト一覧 */}
            <section className="space-y-[12px] max-w-[700px] mx-auto w-full px-2">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-bold">
                        保存済みリスト
                    </h3>
                    <button
                        onClick={handleImport}
                        className="p-2 bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white rounded-lg transition-all"
                        title="インポート"
                    >
                        <Download size={16} />
                    </button>
                </div>

                <div className="space-y-[8px]">
                    {myLayouts.length === 0 ? (
                        <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <p className="text-gray-500 text-sm">レイアウトがありません</p>
                        </div>
                    ) : (
                        myLayouts.map((layout) => (
                            <div
                                key={layout.id}
                                className="group flex items-center justify-between p-3 px-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    {/* 内蔵アイコンを表示 */}
                                    <div className="flex items-center gap-1.5 min-w-[40px]">
                                        {layout.widgets && layout.widgets.length > 0 && (
                                            <div title="ウィジェットを含む" className="p-1 bg-blue-500/10 text-blue-400 rounded">
                                                <Layers size={14} />
                                            </div>
                                        )}
                                        {layout.videoCrop && (
                                            <div title="映像調整を含む" className="p-1 bg-purple-500/10 text-purple-400 rounded">
                                                <Video size={14} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-200 group-hover:text-white transition-colors text-sm">
                                                {layout.name}
                                            </span>
                                            {layout.hideOthers && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full font-bold">Snapshot</span>
                                            )}
                                        </div>
                                        {!layout.isDefault && (
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(layout.createdAt).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => applyLayout(layout.id)}
                                        className="p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all"
                                        title="復元"
                                    >
                                        <Play size={16} fill="currentColor" />
                                    </button>
                                    <button
                                        onClick={() => handleExport(layout.id)}
                                        className="p-2 bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white rounded-lg transition-all"
                                        title="エクスポート"
                                    >
                                        <Upload size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`レイアウト「${layout.name}」を削除しますか？`)) {
                                                deleteLayout(layout.id);
                                            }
                                        }}
                                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                                        title="削除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};
