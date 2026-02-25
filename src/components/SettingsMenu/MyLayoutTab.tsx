import { Layout, Play, Download, Upload, Trash2, Info } from 'lucide-react';
import { useWidgetStore } from '../../store/useWidgetStore';
import { SettingsToggle, SettingItem } from './SettingsUI';

export const MyLayoutTab = () => {
    const myLayouts = useWidgetStore(s => s.myLayouts);
    const applyLayout = useWidgetStore(s => s.applyLayout);
    const deleteLayout = useWidgetStore(s => s.deleteLayout);
    const importLayout = useWidgetStore(s => s.importLayout);
    const hideNonLayoutWidgets = useWidgetStore(s => s.hideNonLayoutWidgets);
    const setHideNonLayoutWidgets = useWidgetStore(s => s.setHideNonLayoutWidgets);

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
            {/* グローバル設定 */}
            <section className="space-y-[8px]">
                <h3 className="text-lg font-bold mb-[8px] flex items-center gap-[6px] border-b border-white/10 pb-[8px]">
                    <Layout size={18} className="text-secondary" />
                    マイレイアウト設定
                </h3>
                <SettingItem
                    title="復元時に他を非表示"
                    icon={<Info size={16} />}
                >
                    <SettingsToggle
                        checked={hideNonLayoutWidgets}
                        onChange={setHideNonLayoutWidgets}
                    />
                </SettingItem>
                <p className="text-[12px] text-gray-500 ml-[44px] mt-[-4px] mb-[4px] leading-relaxed">
                    ONにすると、レイアウトに含まれないウィジェットを自動的に非表示にします。
                </p>
            </section>

            {/* レイアウト一覧 */}
            <section className="space-y-[12px] max-w-[700px] mx-auto w-full px-2">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-bold">
                        保存済みレイアウト
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
                            <p className="text-[11px] text-gray-600 mt-1">
                                ウィジェットを選択してアクションバーの保存ボタンから追加できます。
                            </p>
                        </div>
                    ) : (
                        myLayouts.map((layout) => (
                            <div
                                key={layout.id}
                                className="group flex items-center justify-between p-3 px-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                            >
                                <div className="flex flex-col pl-[32px]">
                                    <span className="font-bold text-gray-200 group-hover:text-white transition-colors text-sm">
                                        {layout.name}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                        {new Date(layout.createdAt).toLocaleString()}
                                    </span>
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
