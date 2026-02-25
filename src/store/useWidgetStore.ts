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

interface MoveableRect {
    left: number;
    top: number;
    width: number;
    height: number;
    rotation: number;
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
    activeMoveableRect: MoveableRect | null;
    isTransforming: boolean;

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
    setActiveMoveableRect: (rect: MoveableRect | null) => void;
    setIsTransforming: (val: boolean) => void;
    clearGroups: () => void;
    groupSelectedWidgets: () => void;
    ungroupSelectedWidgets: () => void;
}

const STORAGE_KEYS = {
    WIDGETS: 'tcg_remote_widget_store_v3',
    GROUPS: 'widget_groups',
    SETTINGS: 'tcg_remote_settings_v4',
};

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
        activeMoveableRect: null,
        isTransforming: false,
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

        setSelectedWidgets: (ids) => set((state) => {
            // グループメンバーが含まれている場合、グループ全員を自動的に追加
            const nextIds = new Set<string>();
            ids.forEach(id => {
                const group = state.groupData.groups.find(g => g.id === id || g.memberIds.includes(id));
                if (group) {
                    group.memberIds.forEach(mid => nextIds.add(mid));
                } else {
                    nextIds.add(id);
                }
            });
            return { selectedWidgetIds: Array.from(nextIds) };
        }),

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
        setActiveMoveableRect: (activeMoveableRect) => set({ activeMoveableRect }),
        setIsTransforming: (isTransforming) => set({ isTransforming }),

        clearGroups: () => {
            set({ groupData: { groups: [], relativeTransforms: {} } });
            localStorage.removeItem(STORAGE_KEYS.GROUPS);
        },

        groupSelectedWidgets: () => set((state) => {
            const { selectedWidgetIds, groupData, widgetStates } = state;
            if (selectedWidgetIds.length < 2) return state;

            const targetIds = new Set<string>();
            selectedWidgetIds.forEach(id => {
                const existingGroup = groupData.groups.find(g => g.id === id);
                if (existingGroup) {
                    existingGroup.memberIds.forEach(mid => targetIds.add(mid));
                } else {
                    targetIds.add(id);
                }
            });

            const newMemberIds = Array.from(targetIds);
            const remainingGroups = groupData.groups.filter(g =>
                !g.memberIds.some(mid => targetIds.has(mid)) && !targetIds.has(g.id)
            );

            const groupId = `group_${Date.now()}`;
            const anchorId = newMemberIds[0] as WidgetId;
            const anchorState = widgetStates[anchorId];

            const newRelativeTransforms = { ...groupData.relativeTransforms };

            // 相対座標の計算 (アンカーを基準にする)
            if (anchorState) {
                const aspect = window.innerWidth / window.innerHeight;
                newMemberIds.forEach(id => {
                    const ms = widgetStates[id as WidgetId];
                    if (ms) {
                        newRelativeTransforms[id as WidgetId] = {
                            dx: (ms.px - anchorState.px) * aspect,
                            dy: ms.py - anchorState.py,
                            dScale: ms.scale / anchorState.scale,
                            dRotation: ms.rotation - anchorState.rotation,
                        };
                    }
                });
            }

            const newGroup = {
                id: groupId,
                memberIds: newMemberIds,
                anchorId: anchorId,
            };

            return {
                groupData: {
                    groups: [...remainingGroups, newGroup],
                    relativeTransforms: newRelativeTransforms,
                },
                selectedWidgetIds: newMemberIds, // メンバー全員を選択状態にする
            };
        }),

        ungroupSelectedWidgets: () => set((state) => {
            const { selectedWidgetIds, groupData } = state;

            // 選択中のIDの中にグループIDが含まれているか、
            // または選択中のウィジェットがいずれかのグループに属している場合に対象とする
            const groupIdsToDissolve = new Set<string>();
            selectedWidgetIds.forEach(id => {
                const g = groupData.groups.find(g => g.id === id || g.memberIds.includes(id));
                if (g) groupIdsToDissolve.add(g.id);
            });

            if (groupIdsToDissolve.size === 0) return state;

            const nextGroups = groupData.groups.filter(g => !groupIdsToDissolve.has(g.id));

            return {
                groupData: {
                    ...groupData,
                    groups: nextGroups,
                }
            };
        }),
    }))
);

// 状態変更時の保存処理（保存に特化）
let updateTimer: ReturnType<typeof setTimeout> | null = null;

useWidgetStore.subscribe(
    (state) => state,
    (state) => {
        if (updateTimer) clearTimeout(updateTimer);
        updateTimer = setTimeout(() => {
            // ウィジェットの基本状態を永続化
            localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify({
                widgetStates: state.widgetStates,
                visibility: state.visibility,
                settings: state.settings,
            }));
            localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(state.groupData));
            // ビデオ設定等は各アクション側で保存済み
        }, 100); // 同一ウィンドウ内での保存なので、少し余裕を持たせる
    }
);
