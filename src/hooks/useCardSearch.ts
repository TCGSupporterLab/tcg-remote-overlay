import { useState, useEffect, useMemo, useCallback } from 'react';
import type { LocalCard } from './useLocalCards';

// Types from the original file
export type FilterCategory = string;

export interface Card {
    id: string;
    name: string;
    imageUrl: string;
    resolvedImageUrl?: string;
    path: string;
    isFolder?: boolean;
    folderPath?: string;
    kana?: string;
    _fileName?: string;
    _normName?: string;
    _hiraName?: string;
    _pureName?: string;
    _pureHira?: string;
    _metadata?: Record<string, any>;
    [key: string]: any;
}

export interface Filters {
    keyword: string;
    categories: Record<string, string[]>;
}

interface SharedState {
    filters: Filters;
    currentPath: string;
    pinnedCards: Card[];
    selectedCard: Card | null;
    remoteCard: Card | null;
    overlayMode: 'on' | 'off';
    overlayDisplayMode: 'image' | 'text';
    overlayForcedCard: Card | null;
    spMarkerMode: 'off' | 'follow' | 'independent';
    spMarkerFace: 'front' | 'back';
    remoteSPMarkerState: any;
    independentMarkerState: any;
    showSPMarkerForceHidden: boolean;
    userInteracted: boolean;
}

const IS_OVERLAY = new URLSearchParams(window.location.search).get('view') === 'overlay';
const CHANNEL_NAME = 'tcg_remote_search_sync';
const channel = new BroadcastChannel(CHANNEL_NAME);

const INITIAL_STATE: SharedState = {
    filters: { keyword: '', categories: {} },
    currentPath: '',
    pinnedCards: [],
    selectedCard: null,
    remoteCard: null,
    overlayMode: 'on',
    overlayDisplayMode: 'image',
    overlayForcedCard: null,
    spMarkerMode: 'off',
    spMarkerFace: 'front',
    remoteSPMarkerState: null,
    independentMarkerState: { x: 50, y: 50, scale: 1, rotation: 0 },
    showSPMarkerForceHidden: false,
    userInteracted: false
};

let sharedState: SharedState = { ...INITIAL_STATE };
const listeners = new Set<() => void>();

channel.onmessage = (event: MessageEvent<SharedState>) => {
    sharedState = event.data;
    listeners.forEach(l => l());
};

const updateShared = (patch: Partial<SharedState>) => {
    sharedState = { ...sharedState, ...patch };
    channel.postMessage(sharedState);
    listeners.forEach(l => l());
};

const normalizeText = (text: string) => {
    if (!text) return '';
    return text.toLowerCase()
        .replace(/[ぁ-ん]/g, m => String.fromCharCode(m.charCodeAt(0) + 0x60))
        .replace(/[ァ-ン]/g, m => m)
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, m => String.fromCharCode(m.charCodeAt(0) - 0xFEE0))
        .trim();
};

const toHiragana = (text: string) => text.replace(/[\u30a1-\u30f6]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));
const removeSymbols = (text: string) => text.replace(/[^\p{L}\p{N}]/gu, '');
const excludeKeys = ['name', 'yomi'];

export const useCardSearch = (
    localCards: LocalCard[] = [],
    metadataOrder: Record<string, Record<string, string[]>> = {},
    mergeSameFileCards: boolean = false
) => {
    const [, setTick] = useState(0);
    const forceUpdate = useCallback(() => setTick(t => t + 1), []);

    useEffect(() => {
        listeners.add(forceUpdate);
        return () => { listeners.delete(forceUpdate); };
    }, [forceUpdate]);

    const normalizedData = useMemo(() => {
        if (!localCards || localCards.length === 0) return [];
        if (import.meta.env.DEV) console.time('[Search] Normalization');
        const results = localCards.map(lc => {
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
                _fileName: lc.path ? lc.path.split('/').pop() : lc.name,
                _normName: combined,
                _hiraName: toHiragana(combined),
                _pureName: removeSymbols(combined),
                _pureHira: removeSymbols(toHiragana(combined)),
                _metadata: m
            } as Card;
        });
        if (import.meta.env.DEV) {
            console.timeEnd('[Search] Normalization');
            console.log(`[Search] Normalized ${results.length} cards`);
        }
        return results;
    }, [localCards]);

    const dynamicFilterOptions = useMemo(() => {
        const options: Record<string, Set<string>> = {};
        const currentPath = sharedState.currentPath;

        // 1. 現在のパス、または親フォルダの _meta_filter.json の定義を遡って探す
        let matchedPath = currentPath;
        let effectiveOrder = metadataOrder[matchedPath];

        while (!effectiveOrder && matchedPath.includes('/')) {
            matchedPath = matchedPath.substring(0, matchedPath.lastIndexOf('/'));
            effectiveOrder = metadataOrder[matchedPath];
        }

        const currentOrder = effectiveOrder || {};

        Object.entries(currentOrder).forEach(([key, values]) => {
            if (excludeKeys.includes(key)) return;
            if (!options[key]) options[key] = new Set();
            values.forEach(v => options[key].add(String(v)));
        });

        // 2. カードデータからも属性を抽出（現在のパス配下のカードのみを対象にする）
        normalizedData.forEach(card => {
            const path = card.path || '';
            // 現在のパス配下のカードのみを対象にすることで、他のTCGの属性が混ざるのを防ぐ
            if (currentPath && !path.startsWith(currentPath + '/')) return;

            const m = card._metadata || {};
            Object.entries(m).forEach(([key, val]) => {
                if (excludeKeys.includes(key)) return;
                if (!options[key]) options[key] = new Set();
                if (Array.isArray(val)) val.forEach(v => options[key].add(String(v)));
                else if (val !== undefined && val !== null) options[key].add(String(val));
            });
        });

        const sorted: Record<string, string[]> = {};
        Object.entries(options).forEach(([key, values]) => {
            // 見つかった定義に従ってソート
            const order = currentOrder[key];
            if (order) {
                sorted[key] = Array.from(values).sort((a, b) => {
                    const idxA = order.indexOf(a);
                    const idxB = order.indexOf(b);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return a.localeCompare(b);
                });
            } else {
                sorted[key] = Array.from(values).sort();
            }
        });
        return sorted;
    }, [normalizedData, metadataOrder, sharedState.currentPath]);

    const activeCategories = useMemo(() => {
        return Object.keys(dynamicFilterOptions).filter(k => !excludeKeys.includes(k));
    }, [dynamicFilterOptions]);

    const filteredCards = useMemo(() => {
        if (import.meta.env.DEV) console.time('[Search] Filtering');
        const { keyword, categories } = sharedState.filters;
        const currentPath = sharedState.currentPath;
        const normKeyword = normalizeText(keyword);
        const hiraKeyword = toHiragana(normKeyword);
        const pureKeyword = removeSymbols(normKeyword);
        const pureHira = removeSymbols(hiraKeyword);

        let results = normalizedData.filter(card => {
            if (normKeyword) {
                const match =
                    card._normName?.includes(normKeyword) ||
                    card._hiraName?.includes(hiraKeyword) ||
                    card._pureName?.includes(pureKeyword) ||
                    card._pureHira?.includes(pureHira);
                if (!match) return false;
            }
            return true;
        });

        const pathParts = currentPath.split('/').filter(Boolean);
        const depth = pathParts.length;

        const folders: Card[] = [];
        let files: Card[] = [];
        const seenFolders = new Set<string>();

        results.forEach(card => {
            const path = card.path || '';
            if (currentPath && !path.startsWith(currentPath + '/')) return;
            const relative = currentPath ? path.slice(currentPath.length + 1) : path;
            const parts = relative.split('/');

            if (parts.length > 1) {
                if (depth < 2) {
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
                }
            } else {
                let match = true;
                for (const [key, selected] of Object.entries(categories)) {
                    if (excludeKeys.includes(key) || !selected?.length || selected.includes('all')) continue;
                    if (!activeCategories.includes(key)) continue;
                    const val = card._metadata?.[key];
                    if (val === undefined || val === null || !(Array.isArray(val) ? val.some(v => selected.includes(String(v))) : selected.includes(String(val)))) {
                        match = false;
                        break;
                    }
                }
                if (match) files.push(card);
            }
        });

        if (mergeSameFileCards) {
            const seen = new Set<string>();
            files = files.filter(card => {
                const key = card._fileName || card.id;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }

        const combined = [...folders, ...files];
        if (import.meta.env.DEV) {
            console.timeEnd('[Search] Filtering');
            console.log(`[Search] Filtered results: ${combined.length} items (Folders: ${folders.length}, Files: ${files.length}). isSyncing will be: ${localCards.length > 0 && combined.length === 0}`);
        }
        return combined;
    }, [normalizedData, sharedState.filters, sharedState.currentPath, mergeSameFileCards, activeCategories]);

    useEffect(() => {
        // すでに手動操作されたか、検索中の場合は何もしない
        if (sharedState.userInteracted) {
            if (import.meta.env.DEV) console.log('[Search] Auto-nav skipped: user already interacted');
            return;
        }
        if (sharedState.filters.keyword) {
            if (import.meta.env.DEV) console.log('[Search] Auto-nav skipped: keyword exists');
            return;
        }

        if (filteredCards.length === 1 && filteredCards[0].isFolder) {
            const folder = filteredCards[0];
            const pathParts = folder.folderPath?.split('/').filter(Boolean) || [];
            const depth = pathParts.length;

            if (import.meta.env.DEV) console.log(`[Search] Potential auto-nav to: ${folder.folderPath} (depth: ${depth})`);

            // 2階層目（depth 2）より深い場合は自動遷移を停止し、全タブで共有する
            if (depth > 2) {
                if (import.meta.env.DEV) console.log('[Search] Auto-nav stopped: too deep');
                updateShared({ userInteracted: true });
                return;
            }

            if (import.meta.env.DEV) console.log('[Search] Executing auto-nav');
            // 自動遷移時は manual=false で呼び出す
            setCurrentPath(folder.folderPath || '', false);
        }
    }, [filteredCards, sharedState.filters.keyword, sharedState.userInteracted]);

    const setCurrentPath = (path: string, manual = true) => {
        const normalizedPath = path.replace(/\\/g, '/');
        if (manual) {
            if (import.meta.env.DEV) console.log(`[Search] Manual path change: ${normalizedPath}`);
            updateShared({ currentPath: normalizedPath, userInteracted: true });
        } else {
            updateShared({ currentPath: normalizedPath });
        }
    };

    return {
        filters: sharedState.filters,
        currentPath: sharedState.currentPath,
        setCurrentPath,
        searchKey: `${sharedState.filters.keyword}-${JSON.stringify(sharedState.filters.categories)}-${sharedState.currentPath}`,
        filteredCards,
        isSyncing: localCards.length > 0 && filteredCards.length === 0,
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
