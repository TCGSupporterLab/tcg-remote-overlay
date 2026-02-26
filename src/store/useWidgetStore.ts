import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { type WidgetId, type WidgetState, type WidgetGroupData, type WidgetGroup, type MyLayout } from '../types/widgetTypes';
import { type VideoSourceType, type CropConfig } from '../components/VideoBackground';

// Default Layouts
const DEFAULT_LAYOUT_MODULES = import.meta.glob('../data/default_layout/*.json', { eager: true });

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
        hideSettingsOnStart: boolean;
    };
    // 選択
    selectedWidgetIds: WidgetId[];
    isSelecting: boolean;
    selectionRect: SelectionRect | null;
    needsSync: boolean;
    // グループ
    groupData: WidgetGroupData;
    activeMoveableRect: MoveableRect | null;
    isTransforming: boolean;

    // システム/ビデオ設定
    obsMode: ObsMode;
    videoSource: VideoSourceType;
    videoCrop: CropConfig;
    viewSize: { w: number; h: number };

    // ダイス・コインの現在の値
    diceValue: 1 | 2 | 3 | 4 | 5 | 6;
    coinValue: 1 | 0;

    // 順序管理
    widgetOrder: WidgetId[];

    // マイレイアウト
    myLayouts: MyLayout[];
    hasImportedDefaultLayouts: boolean;
    hideNonLayoutWidgets: boolean;

    // Actions
    updateWidgetState: (id: WidgetId, state: Partial<WidgetState>) => void;
    setVisibility: (patch: Partial<WidgetStoreState['visibility']>) => void;
    setSettings: (patch: Partial<WidgetStoreState['settings']>) => void;
    setSelectedWidgets: (ids: WidgetId[]) => void;
    setGroupData: (data: WidgetGroupData) => void;
    setObsMode: (mode: ObsMode) => void;
    setVideoSource: (source: VideoSourceType) => void;
    setVideoCrop: (crop: CropConfig) => void;
    setViewSize: (size: { w: number; h: number }) => void;
    setDiceValue: (val: 1 | 2 | 3 | 4 | 5 | 6) => void;
    setCoinValue: (val: 1 | 0) => void;
    setIsSelecting: (val: boolean) => void;
    setSelectionRect: (rect: SelectionRect | null) => void;
    setActiveMoveableRect: (rect: MoveableRect | null) => void;
    setIsTransforming: (val: boolean) => void;
    setNeedsSync: (val: boolean) => void;
    resetWidgets: (ids: WidgetId[]) => void;
    resetWidgetPosition: (id: WidgetId) => void;
    reorderWidgets: (activeId: WidgetId, overId: WidgetId) => void;
    clearGroups: () => void;
    groupSelectedWidgets: () => void;
    ungroupSelectedWidgets: () => void;

    // マイレイアウト Actions
    saveLayout: (name: string) => void;
    applyLayout: (id: string) => void;
    deleteLayout: (id: string) => void;
    importLayout: (data: unknown) => { success: boolean; message?: string };
    setHideNonLayoutWidgets: (val: boolean) => void;
    importDefaultLayouts: () => void;
}

const STORAGE_KEYS = {
    WIDGETS: 'tcg_remote_widget_store_v3',
    GROUPS: 'widget_groups',
    SETTINGS: 'tcg_remote_settings_v4',
    LAYOUTS: 'tcg_remote_my_layouts_v1',
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
            hideSettingsOnStart: false,
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
        needsSync: false,
        viewSize: { w: window.innerWidth, h: window.innerHeight },
        widgetOrder: [] as WidgetId[],
        myLayouts: [],
        hasImportedDefaultLayouts: localStorage.getItem('tcg_remote_layout_imported') === 'true',
        hideNonLayoutWidgets: localStorage.getItem('tcg_remote_hide_non_layout') !== 'false',
    };

    const savedLayouts = localStorage.getItem(STORAGE_KEYS.LAYOUTS);
    if (savedLayouts) {
        try {
            base.myLayouts = JSON.parse(savedLayouts);
        } catch (e) {
            console.error('Failed to parse saved layouts', e);
        }
    }

    if (savedWidgets) {
        try {
            const parsed = JSON.parse(savedWidgets);
            if (parsed.widgetStates) base.widgetStates = parsed.widgetStates;
            if (parsed.visibility) base.visibility = { ...base.visibility, ...parsed.visibility };
            if (parsed.settings) base.settings = { ...base.settings, ...parsed.settings };
            if (parsed.widgetOrder) {
                base.widgetOrder = (parsed.widgetOrder as string[]).map(id => {
                    if (id === 'lp') return 'lp_calculator' as WidgetId;
                    if (id === 'card') return 'card_widget' as WidgetId;
                    return id as WidgetId;
                });
            }
        } catch (e) {
            console.error('Failed to parse saved widget store state', e);
        }
    }

    // 初期順序が未設定または不完全な場合のデフォルト（前面から）
    const DEFAULT_ORDER: WidgetId[] = ['dice', 'coin', 'lp_calculator', 'sp_marker', 'card_widget'];
    if (!base.widgetOrder || base.widgetOrder.length < DEFAULT_ORDER.length) {
        // 既存の順序を活かしつつ不足分を補充、または新規作成
        const existing = base.widgetOrder || [];
        const missing = DEFAULT_ORDER.filter(id => !existing.includes(id));
        base.widgetOrder = [...existing, ...missing];
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
        setNeedsSync: (needsSync) => set({ needsSync }),
        resetWidgets: (ids) => set((state) => {
            const nextStates = { ...state.widgetStates };
            const processedGroups = new Set<string>();

            ids.forEach(id => {
                // そのIDが属するグループを探す
                const group = state.groupData.groups.find(g => g.id === id || g.memberIds.includes(id));

                if (group && !processedGroups.has(group.id)) {
                    if (group.initialStates && group.initialCenter) {
                        // グループリセット:
                        // 1. 各ウィジェットを結合時の状態に戻す
                        // 2. さらに全体を、その時の中心(initialCenter)から(0,0)へ移動させる
                        const offsetX = -group.initialCenter.px;
                        const offsetY = -group.initialCenter.py;

                        group.memberIds.forEach(mid => {
                            const is = group.initialStates![mid];
                            if (is) {
                                nextStates[mid] = {
                                    ...is,
                                    px: is.px + offsetX,
                                    py: is.py + offsetY,
                                };
                            }
                        });
                        processedGroups.add(group.id);
                    } else {
                        // フォールバック: 初期状態がない場合はメンバーを個別に中央へ
                        group.memberIds.forEach(mid => {
                            nextStates[mid] = { px: 0, py: 0, scale: 1, rotation: 0 };
                        });
                        processedGroups.add(group.id);
                    }
                } else if (!group) {
                    // 単体ウィジェットのリセット
                    nextStates[id] = { px: 0, py: 0, scale: 1, rotation: 0 };
                }
            });

            return {
                widgetStates: nextStates,
                needsSync: true,
            };
        }),

        resetWidgetPosition: (id) => set((state) => {
            const nextStates = { ...state.widgetStates };
            const { groupData } = state;

            // そのIDが属するグループを探す
            const group = groupData.groups.find(g => g.id === id || g.memberIds.includes(id));
            let nextGroups = groupData.groups;

            if (group) {
                // グループを解除
                nextGroups = groupData.groups.filter(g => g.id !== group.id);
            }

            // 単体ウィジェットとしてリセット
            nextStates[id] = { px: 0, py: 0, scale: 1, rotation: 0 };

            return {
                widgetStates: nextStates,
                groupData: {
                    ...groupData,
                    groups: nextGroups,
                },
                needsSync: true,
            };
        }),

        reorderWidgets: (activeId, overId) => set((state) => {
            const oldIndex = state.widgetOrder.indexOf(activeId);
            const newIndex = state.widgetOrder.indexOf(overId);

            if (oldIndex === -1 || newIndex === -1) return state;

            const newOrder = [...state.widgetOrder];
            const [removed] = newOrder.splice(oldIndex, 1);
            newOrder.splice(newIndex, 0, removed);

            return { widgetOrder: newOrder };
        }),

        setViewSize: (viewSize) => set({ viewSize }),

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

            const rect = state.activeMoveableRect;
            let initialCenter = { px: 0, py: 0 };
            if (rect) {
                initialCenter = {
                    px: (rect.left + rect.width / 2 - window.innerWidth / 2) / window.innerWidth,
                    py: (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight,
                };
            }

            const initialStates: Record<WidgetId, WidgetState> = {};
            newMemberIds.forEach(id => {
                const s = widgetStates[id as WidgetId];
                if (s) {
                    initialStates[id as WidgetId] = { ...s };
                }
            });

            const newGroup: WidgetGroup = {
                id: groupId,
                memberIds: newMemberIds,
                anchorId: anchorId,
                initialStates,
                initialCenter,
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

        setHideNonLayoutWidgets: (val) => {
            localStorage.setItem('tcg_remote_hide_non_layout', val ? 'true' : 'false');
            set({ hideNonLayoutWidgets: val });
        },

        saveLayout: (name) => set((state) => {
            const { selectedWidgetIds, widgetStates, widgetOrder, visibility, groupData, viewSize } = state;
            if (selectedWidgetIds.length === 0) return state;

            const layoutWidgets = selectedWidgetIds.map(id => ({
                id,
                state: widgetStates[id] || { px: 0, py: 0, scale: 1, rotation: 0 }
            }));

            // 選択されたメンバー全員が含まれるグループのみ保存
            const relevantGroups = groupData.groups.filter(g =>
                g.memberIds.every(mid => selectedWidgetIds.includes(mid))
            );

            // 選択されたウィジェットの表示状態を記録
            const layoutVisibility: Record<WidgetId, boolean> = {};
            selectedWidgetIds.forEach(id => {
                if (id === 'dice') layoutVisibility[id] = visibility.isDiceVisible;
                if (id === 'coin') layoutVisibility[id] = visibility.isCoinVisible;
                if (id === 'lp_calculator') layoutVisibility[id] = visibility.isLPVisible;
                if (id === 'card_widget') layoutVisibility[id] = visibility.isCardWidgetVisible;
                if (id === 'sp_marker') layoutVisibility[id] = visibility.isSPMarkerVisible;
            });

            const layoutOrder = widgetOrder.filter(id => selectedWidgetIds.includes(id));

            const newLayout: MyLayout = {
                id: `layout_${Date.now()}`,
                name,
                widgets: layoutWidgets,
                groups: relevantGroups,
                visibility: layoutVisibility,
                widgetOrder: layoutOrder,
                viewSize: { ...viewSize },
                createdAt: Date.now(),
            };

            const nextLayouts = [...state.myLayouts, newLayout];
            localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(nextLayouts));
            localStorage.setItem('tcg_remote_layout_imported', 'true'); // デフォルト読み込みをスキップさせるため

            return {
                myLayouts: nextLayouts,
                hasImportedDefaultLayouts: true
            };
        }),

        applyLayout: (id) => set((state) => {
            const layout = state.myLayouts.find(l => l.id === id);
            if (!layout) return state;

            const nextWidgetStates = { ...state.widgetStates };
            const nextVisibility = { ...state.visibility };
            let nextWidgetOrder = [...state.widgetOrder];
            const currentGroups = [...state.groupData.groups];
            const nextRelativeTransforms = { ...state.groupData.relativeTransforms };

            const layoutWidgetIds = layout.widgets.map(w => w.id);

            // 1. レイアウト対象ウィジェットの既存グループ解除
            const filteredGroups = currentGroups.filter(g =>
                !g.memberIds.some(mid => layoutWidgetIds.includes(mid))
            );

            // 2. 状態適用と表示ON
            layout.widgets.forEach(lw => {
                nextWidgetStates[lw.id] = lw.state;
                if (lw.id === 'dice') nextVisibility.isDiceVisible = true;
                if (lw.id === 'coin') nextVisibility.isCoinVisible = true;
                if (lw.id === 'lp_calculator') nextVisibility.isLPVisible = true;
                if (lw.id === 'card_widget') nextVisibility.isCardWidgetVisible = true;
                if (lw.id === 'sp_marker') nextVisibility.isSPMarkerVisible = true;
            });

            // 3. グループの再適用
            const nextGroups = [...filteredGroups, ...layout.groups];

            // 相対座標の再計算 (anchorベース)
            layout.groups.forEach(g => {
                const anchorState = nextWidgetStates[g.anchorId];
                if (anchorState) {
                    const aspect = window.innerWidth / window.innerHeight;
                    g.memberIds.forEach(mid => {
                        const ms = nextWidgetStates[mid];
                        if (ms) {
                            nextRelativeTransforms[mid] = {
                                dx: (ms.px - anchorState.px) * aspect,
                                dy: ms.py - anchorState.py,
                                dScale: ms.scale / anchorState.scale,
                                dRotation: ms.rotation - anchorState.rotation,
                            };
                        }
                    });
                }
            });

            // 4. 重なり順の調整（レイアウトに含まれるものを前面へ）
            // まず既存の順序からレイアウト対象を除去
            nextWidgetOrder = nextWidgetOrder.filter(oid => !layoutWidgetIds.includes(oid));
            // レイアウト内の順序を最高優先度（末尾）に追加
            nextWidgetOrder = [...nextWidgetOrder, ...layout.widgetOrder];

            // 5. オプション: 他を隠す
            if (state.hideNonLayoutWidgets) {
                if (!layoutWidgetIds.includes('dice')) nextVisibility.isDiceVisible = false;
                if (!layoutWidgetIds.includes('coin')) nextVisibility.isCoinVisible = false;
                if (!layoutWidgetIds.includes('lp_calculator')) nextVisibility.isLPVisible = false;
                if (!layoutWidgetIds.includes('card_widget')) nextVisibility.isCardWidgetVisible = false;
                if (!layoutWidgetIds.includes('sp_marker')) nextVisibility.isSPMarkerVisible = false;
            }

            return {
                widgetStates: nextWidgetStates,
                visibility: nextVisibility,
                widgetOrder: nextWidgetOrder,
                groupData: {
                    groups: nextGroups,
                    relativeTransforms: nextRelativeTransforms,
                },
                needsSync: true,
            };
        }),

        deleteLayout: (id) => set((state) => {
            const nextLayouts = state.myLayouts.filter(l => l.id !== id);
            localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(nextLayouts));
            return { myLayouts: nextLayouts };
        }),

        importLayout: (data) => {
            try {
                const d = data as any;
                if (!d.name || !Array.isArray(d.widgets)) {
                    return { success: false, message: '不正なレイアウトデータです。' };
                }

                // サニタイズ
                const VALID_IDS: WidgetId[] = ['dice', 'coin', 'lp_calculator', 'card_widget', 'sp_marker'];
                const sanitizedWidgets = d.widgets
                    .filter((w: any) => VALID_IDS.includes(w.id))
                    .map((w: any) => ({
                        id: w.id as WidgetId,
                        state: {
                            px: Math.max(0, Math.min(1, Number(w.state?.px) || 0.5)),
                            py: Math.max(0, Math.min(1, Number(w.state?.py) || 0.5)),
                            scale: Math.max(0.1, Math.min(5, Number(w.state?.scale) || 1)),
                            rotation: (Number(w.state?.rotation) || 0) % 360,
                        }
                    }));

                if (sanitizedWidgets.length === 0) {
                    return { success: false, message: '有効なウィジェットが含まれていません。' };
                }

                const newLayout: MyLayout = {
                    id: `layout_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                    name: String(d.name).substring(0, 40),
                    widgets: sanitizedWidgets,
                    groups: Array.isArray(d.groups) ? d.groups : [],
                    visibility: d.visibility || {},
                    widgetOrder: Array.isArray(d.widgetOrder) ? d.widgetOrder.filter((id: any) => VALID_IDS.includes(id)) : sanitizedWidgets.map((w: any) => w.id),
                    viewSize: d.viewSize || { w: window.innerWidth, h: window.innerHeight },
                    createdAt: Date.now(),
                };

                set((state) => {
                    const nextLayouts = [...state.myLayouts, newLayout];
                    localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(nextLayouts));
                    return { myLayouts: nextLayouts };
                });

                return { success: true };
            } catch (e) {
                return { success: false, message: 'インポートに失敗しました。' };
            }
        },

        importDefaultLayouts: () => set((state) => {
            if (state.hasImportedDefaultLayouts) return state;

            const defaults: MyLayout[] = Object.entries(DEFAULT_LAYOUT_MODULES).map(([path, module]: [string, any]) => {
                const layoutData = module.default;
                const fileName = path.split('/').pop()?.replace('_layout.json', '') || 'default';

                return {
                    ...layoutData,
                    id: `default_${fileName}`,
                    name: layoutData.name || fileName,
                    isDefault: true,
                    createdAt: Date.now() // データ構造上必要だがUIでは非表示にする
                };
            });

            const nextLayouts = [...state.myLayouts, ...defaults];
            localStorage.setItem(STORAGE_KEYS.LAYOUTS, JSON.stringify(nextLayouts));
            localStorage.setItem('tcg_remote_layout_imported', 'true');

            return {
                myLayouts: nextLayouts,
                hasImportedDefaultLayouts: true
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
                widgetOrder: state.widgetOrder,
            }));
            localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(state.groupData));
            // ビデオ設定等は各アクション側で保存済み
        }, 100); // 同一ウィンドウ内での保存なので、少し余裕を持たせる
    }
);
