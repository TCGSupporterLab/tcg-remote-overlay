import { useState, useEffect, useCallback } from 'react';

export type DisplayPreset = 'yugioh' | 'hololive' | 'none';

interface WidgetVisibilitySettings {
    isDiceVisible: boolean;
    isCoinVisible: boolean;
    isLPVisible: boolean;
    isCardWidgetVisible: boolean;
    initialLP: number;
    onlyShowPlayer1: boolean;
    activePreset: DisplayPreset;
}

const SETTINGS_STORAGE_KEY = 'tcg_remote_widget_settings_v4';
const PRESET_STORAGE_KEY = 'tcg_remote_active_preset_v4';
const CHANNEL_NAME = 'tcg_remote_settings_sync';

const DEFAULT_SETTINGS: WidgetVisibilitySettings = {
    isDiceVisible: true,
    isCoinVisible: true,
    isLPVisible: true,
    isCardWidgetVisible: true,
    initialLP: 8000,
    onlyShowPlayer1: false,
    activePreset: 'yugioh'
};

export const useWidgetSettings = () => {
    const [settings, setSettings] = useState<WidgetVisibilitySettings>(() => {
        const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        const savedPreset = localStorage.getItem(PRESET_STORAGE_KEY) as DisplayPreset;

        return {
            ...DEFAULT_SETTINGS,
            ...(savedSettings ? JSON.parse(savedSettings) : {}),
            activePreset: savedPreset || DEFAULT_SETTINGS.activePreset
        };
    });

    const updateSettings = useCallback((patch: Partial<WidgetVisibilitySettings>) => {
        setSettings(prev => {
            const next = { ...prev, ...patch };
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
            if (patch.activePreset) {
                localStorage.setItem(PRESET_STORAGE_KEY, patch.activePreset);
            }

            // Sync across tabs
            const channel = new BroadcastChannel(CHANNEL_NAME);
            channel.postMessage(next);
            channel.close();

            return next;
        });
    }, []);

    useEffect(() => {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = (event) => {
            setSettings(event.data);
        };
        return () => channel.close();
    }, []);

    return {
        ...settings,
        setDiceVisible: (val: boolean) => updateSettings({ isDiceVisible: val }),
        setCoinVisible: (val: boolean) => updateSettings({ isCoinVisible: val }),
        setLPVisible: (val: boolean) => updateSettings({ isLPVisible: val }),
        setCardWidgetVisible: (val: boolean) => updateSettings({ isCardWidgetVisible: val }),
        setInitialLP: (val: number) => updateSettings({ initialLP: val }),
        setOnlyShowPlayer1: (val: boolean) => updateSettings({ onlyShowPlayer1: val }),
        setActivePreset: (preset: DisplayPreset) => updateSettings({ activePreset: preset }),
    };
};
