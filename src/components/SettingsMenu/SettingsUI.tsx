import React from 'react';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export const SettingsToggle = ({ checked, onChange, disabled }: ToggleProps) => (
    <label className="relative inline-flex items-center cursor-pointer pointer-events-auto shrink-0 z-50 ml-[16px]">
        <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
        />
        <div
            className="w-[36px] h-[20px] rounded-full transition-all duration-300 flex items-center px-[2px] shadow-inner relative border border-white/10"
            style={{
                backgroundColor: checked ? '#2563eb' : '#1e293b',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1
            }}
        >
            <div
                className={`bg-white rounded-full h-[16px] w-[16px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ${checked ? 'translate-x-[16px]' : 'translate-x-0'}`}
                style={{ backgroundColor: '#ffffff' }}
            ></div>
        </div>
    </label>
);

interface SectionHeaderProps {
    icon: React.ReactNode;
    title: string;
    borderTop?: boolean;
}

export const SectionHeader = ({ icon, title, borderTop }: SectionHeaderProps) => (
    <div className={`flex items-center gap-[12px] ${borderTop ? 'pt-[8px] border-t border-white/10 mt-[4px]' : ''}`}>
        <div className="p-[8px] rounded-xl bg-white/5 border border-white/10 text-white shadow-lg">
            {icon}
        </div>
        <h2 className="text-lg font-bold tracking-wide text-white drop-shadow-md">{title}</h2>
    </div>
);

interface SettingItemProps {
    icon?: React.ReactNode;
    title: string;
    children?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const SettingItem = ({ icon, title, children, onClick, className }: SettingItemProps) => (
    <div className={`flex items-center justify-between p-[6px] px-[16px] bg-white/5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group outline-none ${className || ''}`} onClick={onClick}>
        <div className="flex items-center gap-[12px]">
            {icon && (
                <div className="p-[8px] rounded-lg bg-black/40 text-gray-400 group-hover:text-secondary transition-colors">
                    {icon}
                </div>
            )}
            <h3 className="text-[15px] font-semibold text-gray-200 group-hover:text-white transition-colors">{title}</h3>
        </div>
        {children}
    </div>
);
