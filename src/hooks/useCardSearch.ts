import { useState, useEffect, useMemo, useCallback } from 'react';
import { get, set } from 'idb-keyval';
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
    overlayForcedCard: Card | null;
    userInteracted: boolean;
    displayCardNo: number;
    rootFolderName: string;
}

const IS_OVERLAY = new URLSearchParams(window.location.search).get('view') === 'overlay';
const CHANNEL_NAME = 'tcg_remote_search_sync';
const PINNED_STORAGE_KEY = 'tcg_remote_pinned_cards_v2';
const PATH_STORAGE_KEY = 'tcg_remote_current_path_v2';
const SELECTED_CARD_STORAGE_KEY = 'tcg_remote_selected_card_v2';
const DISPLAY_NO_STORAGE_KEY = 'tcg_remote_display_card_no_v2';
const FOLDER_CACHE_KEY = 'tcg_remote_folder_cache_v1';

const channel = new BroadcastChannel(CHANNEL_NAME);

const INITIAL_STATE: SharedState = {
    filters: { keyword: '', categories: {} },
    currentPath: '',
    pinnedCards: [],
    selectedCard: null,
    remoteCard: null,
    overlayMode: 'on',
    overlayForcedCard: null,
    userInteracted: false,
    displayCardNo: 0,
    rootFolderName: ''
};

let sharedState: SharedState = { ...INITIAL_STATE };
const listeners = new Set<() => void>();

channel.onmessage = (event: MessageEvent<SharedState>) => {
    sharedState = event.data;
    listeners.forEach(l => l());
};

const updateShared = (patch: Partial<SharedState>, manual = false, skipBroadcast = false) => {
    const oldFolderName = sharedState.rootFolderName;
    sharedState = { ...sharedState, ...patch };

    if (manual) {
        sharedState.userInteracted = true;
    }

    // Broadcast if not explicitly skipped
    if (!skipBroadcast) {
        channel.postMessage(sharedState);
    }

    // 永続化が必要な情報の保存
    if (patch.pinnedCards) {
        set(PINNED_STORAGE_KEY, patch.pinnedCards).catch(err => {
            console.error('[Sync] Failed to persist pinned cards:', err);
        });
    }
    if (patch.currentPath !== undefined) {
        set(PATH_STORAGE_KEY, patch.currentPath).catch(err => {
            console.error('[Sync] Failed to load path:', err);
        });
    }
    if (patch.selectedCard !== undefined) {
        set(SELECTED_CARD_STORAGE_KEY, patch.selectedCard).catch(err => {
            console.error('[Sync] Failed to save selected card:', err);
        });
    }
    if (patch.displayCardNo !== undefined) {
        set(DISPLAY_NO_STORAGE_KEY, patch.displayCardNo).catch(err => {
            console.error('[Sync] Failed to save display card no:', err);
        });
    }

    // Widget settings persistence handled by useWidgetStore



    // フォルダ名が変更された場合のキャッシュ処理（保存のみ・復元はApp.tsx側で行う）
    if (patch.rootFolderName !== undefined && patch.rootFolderName !== oldFolderName) {
        if (import.meta.env.DEV) console.log(`[FolderCache] Name changed: "${oldFolderName}" -> "${patch.rootFolderName}"`);
        // 旧フォルダの状態を保存（fire-and-forget）
        if (oldFolderName) {
            saveFolderCache(oldFolderName, {
                pinnedCards: sharedState.pinnedCards,
                selectedCard: sharedState.selectedCard,
                currentPath: sharedState.currentPath,
                displayCardNo: sharedState.displayCardNo
            });
        }
        // 新フォルダが空の場合（解除）は即座にクリア（同期的）
        if (!patch.rootFolderName) {
            sharedState = {
                ...sharedState,
                pinnedCards: [],
                selectedCard: null,
                currentPath: '',
                displayCardNo: 0
            };
            set(PINNED_STORAGE_KEY, []).catch(() => { });
            set(SELECTED_CARD_STORAGE_KEY, null).catch(() => { });
            set(PATH_STORAGE_KEY, '').catch(() => { });
            set(DISPLAY_NO_STORAGE_KEY, 0).catch(() => { });
            if (import.meta.env.DEV) console.log('[FolderCache] Folder disconnected, state cleared.');
        }
    }

    listeners.forEach(l => l());
};

interface FolderCacheEntry {
    folderName: string;
    pinnedCards: Card[];
    selectedCard: Card | null;
    currentPath: string;
    displayCardNo: number;
    lastOpened: number;
}

/**
 * フォルダのキャッシュを保存（fire-and-forget）
 */
function saveFolderCache(folderName: string, state: Partial<FolderCacheEntry>) {
    const isMain = !window.location.search.includes('view=');
    if (IS_OVERLAY || !isMain) return;

    get(FOLDER_CACHE_KEY).then((raw) => {
        const cache: Record<string, FolderCacheEntry> = (raw as any) || {};
        cache[folderName] = {
            folderName,
            pinnedCards: state.pinnedCards || [],
            selectedCard: state.selectedCard || null,
            currentPath: state.currentPath || '',
            displayCardNo: state.displayCardNo || 0,
            lastOpened: Date.now()
        };

        // 最大5件に制限（古い順に削除）
        const entries = Object.values(cache).sort((a, b) => b.lastOpened - a.lastOpened);
        const newCache: Record<string, FolderCacheEntry> = {};
        entries.slice(0, 5).forEach(e => { newCache[e.folderName] = e; });

        return set(FOLDER_CACHE_KEY, newCache);
    }).then(() => {
        if (import.meta.env.DEV) console.log(`[FolderCache] Saved state for "${folderName}"`);
    }).catch(err => {
        console.error('[FolderCache] Failed to save:', err);
    });
}

/**
 * フォルダキャッシュから復元（App.tsxのuseEffectから呼ばれる）
 */
export async function restoreFolderCache(folderName: string): Promise<boolean> {
    if (!folderName) return false;
    try {
        const cache: Record<string, FolderCacheEntry> = (await get(FOLDER_CACHE_KEY) as any) || {};
        const entry = cache[folderName];
        if (entry) {
            if (import.meta.env.DEV) console.log(`[FolderCache] Restoring state for "${folderName}"`, entry);
            updateShared({
                pinnedCards: entry.pinnedCards || [],
                selectedCard: entry.selectedCard || null,
                currentPath: entry.currentPath || '',
                displayCardNo: entry.displayCardNo || 0
            });
            // 開いた日時を更新
            entry.lastOpened = Date.now();
            await set(FOLDER_CACHE_KEY, cache);
            return true;
        } else {
            if (import.meta.env.DEV) console.log(`[FolderCache] No cache found for "${folderName}"`);
            return false;
        }
    } catch (err) {
        console.error('[FolderCache] Failed to restore:', err);
        return false;
    }
}

// 永続化された情報の復元
if (!IS_OVERLAY) {
    // ピン留め
    get(PINNED_STORAGE_KEY).then(saved => {
        if (saved && Array.isArray(saved)) {
            updateShared({ pinnedCards: saved });
        }
    }).catch(err => console.error('[Sync] Failed to load pinned cards:', err));

    // 現在の階層
    get(PATH_STORAGE_KEY).then(saved => {
        if (saved !== undefined && typeof saved === 'string') {
            updateShared({ currentPath: saved });
        }
    }).catch(err => console.error('[Sync] Failed to load path:', err));

    // 選択中のカード
    get(SELECTED_CARD_STORAGE_KEY).then(saved => {
        if (saved) {
            updateShared({ selectedCard: saved as Card });
        }
    }).catch(err => console.error('[Sync] Failed to load selected card:', err));

    // 表示番号
    get(DISPLAY_NO_STORAGE_KEY).then(saved => {
        if (typeof saved === 'number') {
            updateShared({ displayCardNo: saved });
        }
    }).catch(err => console.error('[Sync] Failed to load display card no:', err));

    // Widget settings persistence handled by useWidgetStore
}

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

/**
 * 2つのカードが同一（ピン留めを同期すべきグループ）かどうかを判定する
 */
const isSameCard = (a: Card, b: Card, mergeOn: boolean) => {
    // 1. 実体パスの一致 (リンクカード対応)
    // どちらかの path または _linkedFrom が、相手のいずれかと一致すれば同一実体
    const aPaths = [a.path, a._linkedFrom].filter(Boolean);
    const bPaths = [b.path, b._linkedFrom].filter(Boolean);
    const isSameEntity = aPaths.some(ap => bPaths.includes(ap));
    if (isSameEntity) return true;

    // 2. 同名ファイルの一致 (設定依存)
    if (mergeOn && a._fileName && b._fileName) {
        return a._fileName === b._fileName;
    }

    return false;
};

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
        // if (import.meta.env.DEV) console.time('[Search] Normalization');
        const results = localCards
            .filter(lc => {
                const parts = (lc.path || '').split('/').filter(Boolean);
                // 物理的な第2階層（例: tcg/set/card.png = 3要素）のみを対象とする
                // 第0, 1階層および第3階層以降はすべて除外
                return parts.length === 3;
            })
            .map(lc => {
                const m = lc.metadata || {};
                const name = m.name || lc.name || '';
                const yomi = m.yomi || lc.yomi || name;

                const norm = normalizeText(name);
                const normYomi = normalizeText(yomi);

                // 【限定】カード名と読み（yomi）のみを検索対象にする
                const combined = [norm, normYomi].filter(Boolean).join(' ');

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
                    _linkedFrom: lc._linkedFrom,
                    _metadata: m
                } as Card;
            });
        /*
        if (import.meta.env.DEV) {
            console.timeEnd('[Search] Normalization');
            console.log(`[Search] Normalized ${results.length} cards`);
        }
        */
        return results;
    }, [localCards]);

    const dynamicFilterOptions = useMemo(() => {
        const options: Record<string, Set<string>> = {};
        const currentPath = sharedState.currentPath;

        // 1. ROOT 階層（パスが空）の場合はフィルタリング項目を表示しない
        if (!currentPath) {
            return {};
        }

        // 2. 現在のパス、または親フォルダの _meta_filter.json の定義を遡って探す
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

        // 3. カードデータからも属性を抽出（現在のパス配下のカードのみを対象にする）
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
        // if (import.meta.env.DEV) console.time('[Search] Filtering');
        const { keyword, categories } = sharedState.filters;
        const currentPath = sharedState.currentPath;
        const normKeyword = normalizeText(keyword);
        const hiraKeyword = toHiragana(normKeyword);
        const pureKeyword = removeSymbols(normKeyword);
        const pureHira = removeSymbols(hiraKeyword);

        if (import.meta.env.DEV && keyword) {
            if (normalizedData.length > 0) {
                const sample = normalizedData.find(d => d.path.toLowerCase().includes('hbd24-001') || d.path.toLowerCase().includes('korone')) || normalizedData[0];
                console.log(`[Search] Keyword: "${keyword}", Data Check ("${sample.name}"):`, {
                    path: sample.path,
                    norm: sample._normName,
                    hasMetadata: Object.keys(sample._metadata || {}).length > 0
                });
            }
        }

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

        /*
        if (import.meta.env.DEV && keyword) {
            console.log(`[Search] Keyword matching finished. Results: ${results.length}`);
            if (results.length > 0 && results.length < 10) {
                results.forEach(r => {
                    console.log(` - Match: "${r.name}" (kana: "${r.kana}")`);
                    console.log(`   Path: ${r.path}`);
                    console.log(`   Metadata:`, r._metadata);
                });
            }
        }
        */

        const pathParts = currentPath.split('/').filter(Boolean);
        const depth = pathParts.length;

        const folders: Card[] = [];
        let files: Card[] = [];
        const seenFolders = new Set<string>();

        results.forEach(card => {
            const path = card.path || '';

            // 階層に基づいた検索範囲の判定（表示上の現在地 depth に依存）
            if (depth === 1) {
                if (!path.startsWith(currentPath + '/')) return;
                // 第1階層では _link.txt 経由のカードは表示しない
                if (card._linkedFrom) return;
            } else if (depth >= 2) {
                if (!path.startsWith(currentPath + '/')) return;
                const relativePath = path.slice(currentPath.length + 1);
                // 2階層目の場合はさらに深いサブフォルダのカードは無視する
                if (relativePath.includes('/')) return;
            }

            const relative = currentPath ? (path.startsWith(currentPath + '/') ? path.slice(currentPath.length + 1) : path) : path;
            const parts = relative.split('/');

            // 属性フィルタが選択されているかチェック
            const hasSelectedCategories = Object.entries(categories).some(([key, selected]) => {
                return !excludeKeys.includes(key) && selected?.length > 0 && !selected.includes('all') && activeCategories.includes(key);
            });

            // フラット表示モードの判定（キーワード検索中、または属性フィルタ選択中）
            const isFlatMode = !!keyword || hasSelectedCategories;

            // 第0階層（ROOT）では常にファイルを表示しないルール
            if (depth === 0) {
                // フォルダ表示のみ継続
            }
            else if (isFlatMode) {
                // 【フラット表示】キーワードまたは属性フィルタがある場合
                // 第1階層からはサブフォルダ内のファイルも、第2階層からは直下のファイルを表示
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

                if (match) {
                    // キーワードがある場合は名前・かな等のキーワードマッチも確認
                    if (keyword) {
                        const normKeyword = normalizeText(keyword);
                        const hiraKeyword = toHiragana(normKeyword);
                        const matchKw =
                            card._normName?.includes(normKeyword) ||
                            card._hiraName?.includes(hiraKeyword);
                        if (!matchKw) match = false;
                    }
                }

                if (match) files.push(card);
                return; // フラットモード時はフォルダ表示をスキップ
            }

            // 【通常表示】階層構造に従って表示
            if (parts.length > 1) {
                // フォルダ表示
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
            } else if (parts.length === 1 && parts[0] !== '') {
                // 直接のファイル（depth 2限定: depth 0, 1 では isFlatMode でない限りここには到達させない）
                if (depth >= 2) {
                    files.push(card);
                }
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
        /*
        if (import.meta.env.DEV) {
            console.timeEnd('[Search] Filtering');
            console.log(`[Search] Filtered results: ${combined.length} items (Folders: ${folders.length}, Files: ${files.length}).`);
        }
        */
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
        const patch: Partial<SharedState> = { currentPath: normalizedPath };

        // 階層移動時はフィルタを常にリセット
        patch.filters = { keyword: '', categories: {} };

        if (manual) {
            if (import.meta.env.DEV) console.log(`[Search] Manual path change: ${normalizedPath}`);
            patch.userInteracted = true;
        }
        updateShared(patch);
    };

    // 初期化時（マウント時）にフィルタをリセット（他タブを壊さないようブロードキャストはしない）
    useEffect(() => {
        updateShared({ filters: { keyword: '', categories: {} } }, false, true);
    }, []);

    // 永続化されたカードデータの再同期（Blob URLおよびメタデータの更新）
    useEffect(() => {
        if (!normalizedData || normalizedData.length === 0) return;

        let pinnedChanged = false;
        const freshPinned = sharedState.pinnedCards.map(pinned => {
            const fresh = normalizedData.find(c => c.id === pinned.id);
            if (fresh && (fresh.imageUrl !== pinned.imageUrl || fresh.name !== pinned.name)) {
                pinnedChanged = true;
                return fresh;
            }
            return pinned;
        });

        let selectedChanged = false;
        let freshSelected = sharedState.selectedCard;
        if (sharedState.selectedCard) {
            const fresh = normalizedData.find(c => c.id === sharedState.selectedCard?.id);
            if (fresh && fresh.imageUrl !== sharedState.selectedCard?.imageUrl) {
                selectedChanged = true;
                freshSelected = fresh;
            }
        }

        if (pinnedChanged || selectedChanged) {
            if (import.meta.env.DEV) console.log(`[Sync] Relinking persisted data with current session cards: pinned=${pinnedChanged}, selected=${selectedChanged}`);
            updateShared({
                pinnedCards: freshPinned,
                selectedCard: freshSelected
            }, false, true); // ローカルのBlob URL不一致による修正なので、他タブへのbroadcastは行わない（無限ループ防止）
        }
    }, [normalizedData, sharedState.pinnedCards]);

    // 設定変更時のピン留め属性の変換
    useEffect(() => {
        if (!normalizedData || normalizedData.length === 0) return;

        const currentPinned = sharedState.pinnedCards;
        if (mergeSameFileCards) {
            // OFF -> ON (結合)：同名ファイルによる重複を排除
            const seenFileNames = new Set<string>();
            const nextPinned = currentPinned.filter(p => {
                const fileName = p._fileName || p.name;
                if (seenFileNames.has(fileName)) return false;
                seenFileNames.add(fileName);
                return true;
            });
            if (nextPinned.length !== currentPinned.length) {
                if (import.meta.env.DEV) console.log(`[Sync] Setting change (Merge ON): Deduplicating pinned cards from ${currentPinned.length} to ${nextPinned.length}`);
                updateShared({ pinnedCards: nextPinned });
            }
        } else {
            // ON -> OFF (展開)：代表1枚から同名ファイルをすべて明示的なピン留めに展開
            const expandedPinned: Card[] = [];
            const seenIds = new Set<string>();

            currentPinned.forEach(p => {
                const fileName = p._fileName || p.name;
                // 全データから同名ファイルをすべて抽出
                const siblings = normalizedData.filter(d => (d._fileName || d.name) === fileName);
                siblings.forEach(s => {
                    if (!seenIds.has(s.id)) {
                        seenIds.add(s.id);
                        expandedPinned.push(s);
                    }
                });
            });

            if (expandedPinned.length !== currentPinned.length) {
                if (import.meta.env.DEV) console.log(`[Sync] Setting change (Merge OFF): Expanding pinned cards from ${currentPinned.length} to ${expandedPinned.length}`);
                updateShared({ pinnedCards: expandedPinned });
            }
        }
    }, [mergeSameFileCards]);

    return {
        filters: sharedState.filters,
        currentPath: sharedState.currentPath,
        setCurrentPath,
        searchKey: `${sharedState.filters.keyword}-${JSON.stringify(sharedState.filters.categories)}-${sharedState.currentPath}`,
        filteredCards,
        isSyncing: false,
        pinnedCards: sharedState.pinnedCards,
        pinnedUniqueKeys: useMemo(() => {
            if (sharedState.pinnedCards.length === 0) return new Set<string>();
            const keys = new Set<string>();

            // 仮想カード（フォルダ）の状態判定用に、全正規化データをスキャン
            // filteredCards に含まれるフォルダの状態をチェックするための準備
            const isCardPinned = (card: Card) => sharedState.pinnedCards.some(p => isSameCard(card, p, mergeSameFileCards));

            // 1. 通常のカードのピン留めを記録
            normalizedData.forEach(card => {
                if (isCardPinned(card)) {
                    keys.add(`${card.id}-${card.imageUrl}`);
                }
            });

            // 2. フォルダのピン留め（中身が全てピン留めされているか）を記録
            filteredCards.filter(c => c.isFolder).forEach(folder => {
                const folderPathPrefix = (folder.folderPath || folder.path) + '/';
                // フォルダ配下の「有効なカード」（実体 / 第2階層）を抽出
                const children = normalizedData.filter(d => {
                    const dPath = d.path || '';
                    if (!dPath.startsWith(folderPathPrefix)) return false;
                    // 第3階層以降は無視
                    const relative = dPath.slice(folderPathPrefix.length);
                    return !relative.includes('/');
                });

                if (children.length > 0 && children.every(isCardPinned)) {
                    keys.add(`${folder.id}-${folder.imageUrl}`);
                }
            });

            return keys;
        }, [sharedState.pinnedCards, normalizedData, filteredCards, mergeSameFileCards]),
        selectedCard: sharedState.selectedCard,
        overlayCard: IS_OVERLAY ? sharedState.remoteCard : (sharedState.overlayForcedCard || sharedState.selectedCard),
        overlayMode: sharedState.overlayMode,
        dynamicFilterOptions,
        setKeyword: (keyword: string) => updateShared({ filters: { ...sharedState.filters, keyword } }),
        updateFilter: (category: FilterCategory, value: string) => {
            const cur = sharedState.filters.categories[category] || ['all'];
            let next = value === 'all' ? ['all'] : (cur.includes(value) ? cur.filter(v => v !== value) : [...cur.filter(v => v !== 'all'), value]);
            if (!next.length) next = ['all'];
            updateShared({ filters: { ...sharedState.filters, categories: { ...sharedState.filters.categories, [category]: next } } }, true);
        },
        togglePin: (card: Card) => {
            if (card.isFolder) {
                // フォルダの一括操作
                const folderPathPrefix = (card.folderPath || card.path) + '/';
                const children = normalizedData.filter(d => {
                    const dPath = d.path || '';
                    if (!dPath.startsWith(folderPathPrefix)) return false;
                    const relative = dPath.slice(folderPathPrefix.length);
                    return !relative.includes('/');
                });

                if (children.length === 0) return;

                // フォルダ内の全カードが既にピン留めされているかチェック
                const allPinned = children.every(c => sharedState.pinnedCards.some(p => isSameCard(c, p, mergeSameFileCards)));

                if (allPinned) {
                    // 全解除：フォルダ配下のすべてのカードを除去
                    const nextPinned = sharedState.pinnedCards.filter(p => !children.some(c => isSameCard(c, p, mergeSameFileCards)));
                    updateShared({ pinnedCards: nextPinned });
                } else {
                    // 一括追加：未登録のグループのみを追加
                    let nextPinned = [...sharedState.pinnedCards];
                    children.forEach(c => {
                        const exists = nextPinned.some(p => isSameCard(c, p, mergeSameFileCards));
                        if (!exists) {
                            nextPinned.push(c);
                        }
                    });
                    updateShared({ pinnedCards: nextPinned });
                }
            } else {
                // 通常のカード操作
                const isCurrentlyPinned = sharedState.pinnedCards.some(p => isSameCard(card, p, mergeSameFileCards));

                if (isCurrentlyPinned) {
                    const nextPinned = sharedState.pinnedCards.filter(p => !isSameCard(card, p, mergeSameFileCards));
                    updateShared({ pinnedCards: nextPinned });
                } else {
                    const alreadyHasGroup = sharedState.pinnedCards.some(p => isSameCard(card, p, mergeSameFileCards));
                    if (!alreadyHasGroup) {
                        updateShared({ pinnedCards: [...sharedState.pinnedCards, card] });
                    }
                }
            }
        },
        resetPins: () => updateShared({ pinnedCards: [] }),
        reorderPins: (s: number, e: number) => {
            const r = [...sharedState.pinnedCards]; const [m] = r.splice(s, 1); r.splice(e, 0, m);
            updateShared({ pinnedCards: r });
        },
        setSelectedCard: (card: Card | null) => updateShared({ selectedCard: card }),
        setOverlayForcedCard: (card: Card | null) => updateShared({ overlayForcedCard: card }),
        toggleOverlayMode: () => updateShared({ overlayMode: sharedState.overlayMode === 'off' ? 'on' : 'off' }),
        resetFilters: () => updateShared({ filters: { keyword: '', categories: {} } }),
        displayCardNo: sharedState.displayCardNo,
        setDisplayCardNo: (no: number) => updateShared({ displayCardNo: no }),
        rootFolderName: sharedState.rootFolderName,
        setRootFolderName: (name: string) => updateShared({ rootFolderName: name })
    };
};
