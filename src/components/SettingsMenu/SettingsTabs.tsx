import React from 'react';
import { Info, Settings2, Camera, Save, Heart } from 'lucide-react';

export type TabType = 'guide' | 'layout' | 'widgets' | 'video' | 'about';

interface TabItem {
    id: TabType;
    label: string;
    icon: React.ReactNode;
}

interface SettingsTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

const TABS: TabItem[] = [
    { id: 'widgets', label: 'ウィジェット', icon: <Settings2 size={18} className="text-purple-400" /> },
    { id: 'video', label: '背景・映像', icon: <Camera size={18} className="text-blue-400" /> },
    { id: 'layout', label: 'マイレイアウト', icon: <Save size={18} className="text-green-400" /> },
    { id: 'guide', label: '操作説明', icon: <Info size={18} className="text-cyan-400" /> },
    { id: 'about', label: 'About', icon: <Heart size={18} className="text-red-400" /> }
];

export const SettingsTabs = ({ activeTab, onTabChange }: SettingsTabsProps) => (
    <div className="flex w-full border-b border-border/50 bg-black/20 px-[0px] pt-[0px] no-scrollbar gap-[1px]">
        {TABS.map((tab) => (
            <button
                key={tab.id}
                className={`flex-1 justify-center px-[12px] py-[6px] border-b-2 font-bold transition-colors flex items-center gap-[6px] whitespace-nowrap text-base ${activeTab === tab.id ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                onClick={() => onTabChange(tab.id)}
            >
                {tab.icon}
                {tab.label}
            </button>
        ))}
    </div>
);
