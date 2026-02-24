import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { type WidgetId, type WidgetState, type WidgetGroupData } from '../types/widgetTypes';
import { type VideoSourceType, type CropConfig } from '../components/VideoBackground';

export type ObsMode = 'normal' | 'green';
export type DisplayPreset = 'yugioh' | 'hololive' | 'none';
export type SPMarkerFace = 'front' | 'back';

interface SelectionRect {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

interface WidgetStoreState {
    // ウィジェットの状態
    widgetStates: Record<WidgetId, WidgetState>;
    // 可視性
    visibility: {
        isDiceVisible: boolean;
        isCoinVisible: boolean;
        isLPVisible: boolean;
        isCardWidgetVisible: boolean;
        isSPMarkerVisible: boolean;
        showSPMarkerForceHidden: boolean;
    };
    // 詳細設定
    settings: {
        initialLP: number;
        onlyShowPlayer1: boolean;
        activePreset: DisplayPreset;
        spMarkerFace: SPMarkerFace;
    };
    // 選択
    selectedWidgetIds: WidgetId[];
    isSelecting: boolean;
    selectionRect: SelectionRect | null;
    // グループ
    groupData: WidgetGroupData;

    // システム/ビデオ設定
    obsMode: ObsMode;
    videoSource: VideoSourceType;
    videoCrop: CropConfig;

    // ダイス・コインの現在の値
    diceValue: 1 | 2 | 3 | 4 | 5 | 6;
    coinValue: 1 | 0;

    // Actions
    updateWidgetState: (id: WidgetId, state: Partial<WidgetState>) => void;
    setVisibility: (patch: Partial<WidgetStoreState['visibility']>) => void;
    setSettings: (patch: Partial<WidgetStoreState['settings']>) => void;
    setSelectedWidgets: (ids: WidgetId[]) => void;
    setGroupData: (data: WidgetGroupData) => void;
    setObsMode: (mode: ObsMode) => void;
    setVideoSource: (source: VideoSourceType) => void;
    setVideoCrop: (crop: CropConfig) => void;
    setDiceValue: (val: 1 | 2 | 3 | 4 | 5 | 6) => void;
    setCoinValue: (val: 1 | 0) => void;
    setIsSelecting: (val: boolean) => void;
    setSelectionRect: (rect: SelectionRect | null) => void;
}

const STORAGE_KEYS = {
    WIDGETS: 'tcg_remote_widget_store_v3',
    GROUPS: 'widget_groups',
    SETTINGS: 'tcg_remote_settings_v4',
};

const SYNC_CHANNEL = 'tcg_remote_widget_sync_v3';

const DEFAULT_CROP: CropConfig = { x: 0, y: 0, scale: 1, top: 0, bottom: 0, left: 0, right: 0, rotation: 0, flipH: false, flipV: false };

const getInitialState = () => {
    const savedWidgets = localStorage.getItem(STORAGE_KEYS.WIDGETS);
    const savedGroups = localStorage.getItem(STORAGE_KEYS.GROUPS);

    const base = {
        widgetStates: {} as Record<WidgetId, WidgetState>,
        visibility: {
            isDiceVisible: true,
            isCoinVisible: true,
            isLPVisible: true,
            isCardWidgetVisible: true,
            isSPMarkerVisible: false,
            showSPMarkerForceHidden: false,
        },
        settings: {
            initialLP: 8000,
            onlyShowPlayer1: false,
            activePreset: 'yugioh' as DisplayPreset,
            spMarkerFace: 'front' as SPMarkerFace,
        },
        selectedWidgetIds: [],
        groupData: savedGroups ? JSON.parse(savedGroups) : { groups: [], relativeTransforms: {} },
        obsMode: (localStorage.getItem('tcg_remote_obs_mode') as ObsMode) || 'normal',
        videoSource: (localStorage.getItem('tcg_remote_video_source') || 'none') as VideoSourceType,
        videoCrop: DEFAULT_CROP,
        diceValue: 1 as const,
        coinValue: 1 as const,
        isSelecting: false,
        selectionRect: null,
    };

    if (savedWidgets) {
        try {
            const parsed = JSON.parse(savedWidgets);
            if (parsed.widgetStates) base.widgetStates = parsed.widgetStates;
            if (parsed.visibility) base.visibility = { ...base.visibility, ...parsed.visibility };
            if (parsed.settings) base.settings = { ...base.settings, ...parsed.settings };
        } catch (e) {
            console.error('Failed to parse saved widget store state', e);
        }
    }

    const savedCrop = localStorage.getItem('tcg_remote_video_crop');
    if (savedCrop) base.videoCrop = JSON.parse(savedCrop);

    return base;
};

export const useWidgetStore = create<WidgetStoreState>()(
    subscribeWithSelector((set) => ({
        ...getInitialState(),

        updateWidgetState: (id, patch) => set((state) => {
            const current = state.widgetStates[id] || { px: 0, py: 0, scale: 1, rotation: 0 };
            return {
                widgetStates: {
                    ...state.widgetStates,
                    [id]: { ...current, ...patch },
                }
            };
        }),

        setVisibility: (patch) => set((state) => ({
            visibility: { ...state.visibility, ...patch }
        })),

        setSettings: (patch) => set((state) => ({
            settings: { ...state.settings, ...patch }
        })),

        setSelectedWidgets: (ids) => set({ selectedWidgetIds: ids }),

        setGroupData: (groupData) => set({ groupData }),

        setObsMode: (obsMode) => {
            localStorage.setItem('tcg_remote_obs_mode', obsMode);
            set({ obsMode });
        },

        setVideoSource: (videoSource) => {
            localStorage.setItem('tcg_remote_video_source', videoSource);
            set({ videoSource });
        },

        setVideoCrop: (videoCrop) => {
            localStorage.setItem('tcg_remote_video_crop', JSON.stringify(videoCrop));
            set({ videoCrop });
        },

        setDiceValue: (diceValue) => set({ diceValue }),
        setCoinValue: (coinValue) => set({ coinValue }),
        setIsSelecting: (isSelecting) => set({ isSelecting }),
        setSelectionRect: (selectionRect) => set({ selectionRect }),
    }))
);

let isInternalUpdate = false;

useWidgetStore.subscribe(
    (state) => state,
    (state) => {
        if (isInternalUpdate) return;

        localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify({
            widgetStates: state.widgetStates,
            visibility: state.visibility,
            settings: state.settings,
        }));
        localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(state.groupData));

        const channel = new BroadcastChannel(SYNC_CHANNEL);
        channel.postMessage({
            widgetStates: state.widgetStates,
            visibility: state.visibility,
            settings: state.settings,
            groupData: state.groupData,
            diceValue: state.diceValue,
            coinValue: state.coinValue,
            videoCrop: state.videoCrop,
        });
        channel.close();
    }
);

const channel = new BroadcastChannel(SYNC_CHANNEL);
channel.onmessage = (event) => {
    isInternalUpdate = true;
    useWidgetStore.setState({
        ...event.data
    });
    isInternalUpdate = false;
};
