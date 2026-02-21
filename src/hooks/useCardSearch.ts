import { useState, useMemo, useCallback, useEffect } from 'react';
import type { LocalCard } from './useLocalCards';

const IS_OVERLAY = typeof window !== 'undefined' && (window.location.pathname.includes('/overlay') || new URLSearchParams(window.location.search).get('mode') === 'overlay');
const CHANNEL_NAME = 'tcg_remote_overlay_sync';

// --- TYPES ---
export type FilterCategory = string;
export interface Filters {
    keyword: string;
    categories: Record<FilterCategory, string[]>;
}

export interface Card {
    id: string;
    name: string;
    path: string;
    imageUrl: string;
    resolvedImageUrl?: string;
    expansion?: string;
    rarity?: string;
    tags?: string;
    kana?: string;
    _normName?: string;
    _hiraName?: string;
    _pureName?: string;
    _pureHira?: string;
    isFolder?: boolean;
    folderPath?: string;
    [key: string]: any;
}

export interface SharedState {
    filters: Filters;
    currentPath: string; // Move to shared state
    pinnedCards: Card[];
    selectedCard: Card | null;
    overlayForcedCard: Card | null;
    overlayMode: 'on' | 'off';
    overlayDisplayMode: 'image' | 'text';
    remoteCard: Card | null;
    spMarkerMode: 'off' | 'follow' | 'independent';
    spMarkerFace: 'front' | 'back';
    showSPMarkerForceHidden: boolean;
    remoteSPMarkerState: any;
    independentMarkerState: any;
}

// --- STATE (SINGLETON) ---
let sharedState: SharedState = {
    filters: { keyword: '', categories: {} },
    currentPath: '',
    pinnedCards: [],
    selectedCard: null,
    overlayForcedCard: null,
    overlayMode: 'on',
    overlayDisplayMode: 'image',
    remoteCard: null,
    spMarkerMode: 'follow',
    spMarkerFace: 'front',
    showSPMarkerForceHidden: false,
    remoteSPMarkerState: null,
    independentMarkerState: null
};

// --- SYNC ---
const listeners = new Set<() => void>();
let syncChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined') {
    syncChannel = new BroadcastChannel(CHANNEL_NAME);
    syncChannel.onmessage = (e) => {
        if (e.data.type === 'UPDATE_STATE') {
            sharedState = { ...sharedState, ...e.data.state };
            listeners.forEach(l => l());
        } else if (e.data.type === 'REQ_STATE') {
            const reply = new BroadcastChannel(CHANNEL_NAME);
            reply.postMessage({ type: 'UPDATE_STATE', state: sharedState });
            reply.close();
        }
    };
    syncChannel.postMessage({ type: 'REQ_STATE' });
}

export const updateShared = (updates: Partial<SharedState>) => {
    if (updates.spMarkerMode !== undefined && updates.spMarkerMode !== sharedState.spMarkerMode) {
        updates.showSPMarkerForceHidden = false;
    }
    sharedState = { ...sharedState, ...updates };
    if (syncChannel) syncChannel.postMessage({ type: 'UPDATE_STATE', state: sharedState });
    listeners.forEach(l => l());
};

// --- HELPERS ---
const normalizeText = (text: string) => {
    if (!text) return '';
    return text.toLowerCase().normalize('NFKC').replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
};
const toHiragana = (text: string) => text.replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
const removeSymbols = (text: string) => text.replace(/[^\p{L}\p{N}]/gu, '');
const excludeKeys = ['name', 'yomi', 'imageUrl', 'resolvedImageUrl', 'id', 'path', 'kana', '_normName', '_hiraName', '_pureName', '_pureHira', 'isFolder', 'folderPath'];

// --- HOOK ---
export const useCardSearch = (
    localCards: LocalCard[] = [],
    folderMetadataMap: Map<string, any> = new Map()
) => {
    const [, setTick] = useState(0);
    const forceUpdate = useCallback(() => setTick(t => t + 1), []);

    useEffect(() => {
        listeners.add(forceUpdate);
        return () => { listeners.delete(forceUpdate); };
    }, [forceUpdate]);

    const activeFolderMetadata = useMemo(() => {
        let path = sharedState.currentPath;
        while (true) {
            const meta = folderMetadataMap.get(path);
            if (meta) return meta;
            if (!path) break;
            const lastSlash = path.lastIndexOf('/');
            path = lastSlash === -1 ? '' : path.substring(0, lastSlash);
        }
        return null;
    }, [sharedState.currentPath, folderMetadataMap]);

    const activeOrder = useMemo(() => activeFolderMetadata?.__order || {}, [activeFolderMetadata]);

    const normalizedData = useMemo(() => {
        if (!localCards || localCards.length === 0) return [];
        return localCards.map(lc => {
            const m = lc.metadata || {};
            const name = m.name || lc.name || '';
            const yomi = lc.yomi || name;
            const norm = normalizeText(name);
            const normYomi = normalizeText(yomi);
            const combined = norm !== normYomi ? norm + ' ' + normYomi : norm;
            return {
                ...m,
                id: lc.id,
                name: name,
                path: lc.path || '',
                imageUrl: lc.url || '',
                resolvedImageUrl: lc.url || '',
                kana: yomi,
                _normName: combined,
                _hiraName: toHiragana(combined),
                _pureName: removeSymbols(combined),
                _pureHira: removeSymbols(toHiragana(combined))
            } as Card;
        });
    }, [localCards]);

    const filteredCards = useMemo(() => {
        if (normalizedData.length === 0) return [];
        const { keyword, categories } = sharedState.filters;
        const currentPath = sharedState.currentPath;
        const normKeyword = normalizeText(keyword);
        const activeCategories = Object.keys(activeOrder);

        if (normKeyword) {
            const escaped = normKeyword.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped.replace(/\*/g, '.*'), 'i');
            return normalizedData.filter(card => {
                const searchMatch = regex.test(card._normName!) || regex.test(card._hiraName!) || regex.test(card._pureName!) || regex.test(card._pureHira!);
                if (!searchMatch) return false;
                for (const [key, selected] of Object.entries(categories)) {
                    if (excludeKeys.includes(key) || !selected?.length || selected.includes('all')) continue;
                    if (!activeCategories.includes(key)) continue; // Only apply active categories
                    const val = (card as any)[key];
                    if (val === undefined || val === null) return false;
                    const match = Array.isArray(val) ? val.some(v => selected.includes(String(v))) : selected.includes(String(val));
                    if (!match) return false;
                }
                return true;
            });
        }

        const folders: Card[] = [];
        const files: Card[] = [];
        const seenFolders = new Set<string>();
        normalizedData.forEach(card => {
            const path = card.path || '';
            if (currentPath && !path.startsWith(currentPath + '/')) return;
            const relative = currentPath ? path.slice(currentPath.length + 1) : path;
            const parts = relative.split('/');
            if (parts.length > 1) {
                const folderName = parts[0];
                if (!seenFolders.has(folderName)) {
                    seenFolders.add(folderName);
                    folders.push({
                        id: `folder:${currentPath ? currentPath + '/' : ''}${folderName}`,
                        name: folderName,
                        imageUrl: '',
                        isFolder: true,
                        folderPath: currentPath ? `${currentPath}/${folderName}` : folderName,
                        path: currentPath ? `${currentPath}/${folderName}` : folderName
                    } as Card);
                }
            } else {
                let match = true;
                for (const [key, selected] of Object.entries(categories)) {
                    if (excludeKeys.includes(key) || !selected?.length || selected.includes('all')) continue;
                    if (!activeCategories.includes(key)) continue; // Only apply active categories
                    const val = (card as any)[key];
                    if (val === undefined || val === null || !(Array.isArray(val) ? val.some(v => selected.includes(String(v))) : selected.includes(String(val)))) {
                        match = false;
                        break;
                    }
                }
                if (match) files.push(card);
            }
        });
        return [...folders, ...files];
    }, [normalizedData, sharedState.currentPath, sharedState.filters, activeOrder]);

    const dynamicFilterOptions = useMemo(() => {
        const targetKeys = Object.keys(activeOrder);
        if (targetKeys.length === 0) return {};
        const options: Record<string, Set<string>> = {};

        // フィルタ（キーワード以外）によって選択肢が消えないよう、
        // キーワード検索時は全データから、そうでない時は「現在の階層の全カード」から抽出する
        let sourceCards = normalizedData;
        if (!sharedState.filters.keyword && sharedState.currentPath) {
            sourceCards = normalizedData.filter(c => c.path?.startsWith(sharedState.currentPath + '/'));
        }

        sourceCards.forEach(c => {
            if (c.isFolder) return;
            Object.keys(c).forEach(key => {
                if (excludeKeys.includes(key) || !targetKeys.includes(key)) return;
                const val = (c as any)[key];
                if (val === undefined || val === null || val === '') return;
                if (!options[key]) options[key] = new Set<string>();
                if (Array.isArray(val)) val.forEach(v => options[key].add(String(v)));
                else options[key].add(String(val));
            });
        });
        const sorted: Record<string, string[]> = {};
        const cats = Object.keys(options);
        const catOrder = Object.keys(activeOrder);
        cats.sort((a, b) => {
            const ia = catOrder.indexOf(a), ib = catOrder.indexOf(b);
            if (ia !== -1 && ib !== -1) return ia - ib;
            return ia !== -1 ? -1 : ib !== -1 ? 1 : a.localeCompare(b);
        });
        cats.forEach(cat => {
            const items = Array.from(options[cat]), itemOrder = activeOrder[cat] || [];
            items.sort((a, b) => {
                const ia = itemOrder.indexOf(a), ib = itemOrder.indexOf(b);
                if (ia !== -1 && ib !== -1) return ia - ib;
                return ia !== -1 ? -1 : ib !== -1 ? 1 : a.localeCompare(b);
            });
            sorted[cat] = items;
        });
        return sorted;
    }, [normalizedData, filteredCards, activeOrder, sharedState.filters.keyword]);

    return {
        filters: sharedState.filters,
        currentPath: sharedState.currentPath,
        setCurrentPath: (path: string) => updateShared({ currentPath: path }),
        searchKey: `${sharedState.filters.keyword}-${JSON.stringify(sharedState.filters.categories)}-${sharedState.currentPath}`,
        filteredCards,
        pinnedCards: sharedState.pinnedCards,
        pinnedUniqueKeys: useMemo(() => new Set(sharedState.pinnedCards.map(c => `${c.id}-${c.imageUrl}`)), [sharedState.pinnedCards]),
        selectedCard: sharedState.selectedCard,
        overlayCard: IS_OVERLAY ? sharedState.remoteCard : (sharedState.overlayForcedCard || sharedState.selectedCard),
        overlayMode: sharedState.overlayMode,
        overlayDisplayMode: sharedState.overlayDisplayMode,
        spMarkerMode: sharedState.spMarkerMode,
        spMarkerFace: sharedState.spMarkerFace,
        spMarkerState: sharedState.spMarkerMode === 'independent' ? sharedState.independentMarkerState : sharedState.remoteSPMarkerState,
        showSPMarkerForceHidden: sharedState.showSPMarkerForceHidden,
        dynamicFilterOptions,
        setKeyword: (keyword: string) => updateShared({ filters: { ...sharedState.filters, keyword } }),
        updateFilter: (category: FilterCategory, value: string) => {
            const cur = sharedState.filters.categories[category] || ['all'];
            let next = value === 'all' ? ['all'] : (cur.includes(value) ? cur.filter(v => v !== value) : [...cur.filter(v => v !== 'all'), value]);
            if (!next.length) next = ['all'];
            updateShared({ filters: { ...sharedState.filters, categories: { ...sharedState.filters.categories, [category]: next } } });
        },
        togglePin: (card: Card) => {
            const exists = sharedState.pinnedCards.some(c => c.id === card.id && c.imageUrl === card.imageUrl);
            if (exists) updateShared({ pinnedCards: sharedState.pinnedCards.filter(c => !(c.id === card.id && c.imageUrl === card.imageUrl)) });
            else updateShared({ pinnedCards: [...sharedState.pinnedCards, card] });
        },
        resetPins: () => updateShared({ pinnedCards: [] }),
        reorderPins: (s: number, e: number) => {
            const r = [...sharedState.pinnedCards]; const [m] = r.splice(s, 1); r.splice(e, 0, m);
            updateShared({ pinnedCards: r });
        },
        setSelectedCard: (card: Card | null) => updateShared({ selectedCard: card }),
        setOverlayForcedCard: (card: Card | null) => updateShared({ overlayForcedCard: card }),
        setOverlayDisplayMode: (mode: 'image' | 'text') => updateShared({ overlayDisplayMode: mode }),
        toggleOverlayMode: () => updateShared({ overlayMode: sharedState.overlayMode === 'off' ? 'on' : 'off' }),
        toggleOverlayDisplayMode: () => updateShared({ overlayDisplayMode: sharedState.overlayDisplayMode === 'image' ? 'text' : 'image' }),
        toggleSPMarkerMode: () => {
            const modes: any[] = ['off', 'follow', 'independent'];
            updateShared({ spMarkerMode: modes[(modes.indexOf(sharedState.spMarkerMode) + 1) % 3] });
        },
        toggleSPMarkerFace: () => updateShared({ spMarkerFace: sharedState.spMarkerFace === 'front' ? 'back' : 'front' }),
        toggleSPMarkerForceHidden: () => updateShared({ showSPMarkerForceHidden: !sharedState.showSPMarkerForceHidden }),
        updateIndependentMarkerState: (s: any) => updateShared({ independentMarkerState: s })
    };
};
