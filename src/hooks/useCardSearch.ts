import { useState, useMemo, useEffect, useCallback } from 'react';
import cardDataOriginal from '../data/hololive-cards.json';

// Type Definitions
export interface Card {
    id: string;
    name: string;
    cardType: string;
    hp?: string;
    color: string;
    bloomLevel?: string;
    rarity: string;
    tags: string;
    expansion: string;
    imageUrl: string;
    resolvedImageUrl?: string;
    oshiSkills?: Array<{ label: string; name: string; cost: string; text: string }>;
    arts?: Array<{ name: string; costs: string[]; damage: string; tokkou: string; text: string }>;
    keywords?: Array<{ type: string; name: string; text: string }>;
    abilityText?: string;
    extra?: string;
    limited?: boolean;
    batonTouch?: string;
    _normName?: string;
    _hiraName?: string;
    _joinedText?: string;
}

export type FilterCategory = 'color' | 'cardType' | 'bloomLevel';

export interface Filters {
    keyword: string;
    color: string[];
    cardType: string[];
    bloomLevel: string[];
}

// Utility: Normalize text for search
const normalizeText = (text: string) => {
    return text
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[ぁ-ん]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60)) // Hiragana to Katakana
        .trim();
};

const toHiragana = (text: string) => {
    return text.replace(/[ァ-ン]/g, s => String.fromCharCode(s.charCodeAt(0) - 0x60));
};

const removeSymbols = (text: string) => {
    return text.replace(/[・ー\s\-\!\?\.\,]/g, '');
};

// --- SINGLETON STATE MANAGER ---
const IS_OVERLAY = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'overlay';

const sharedState = {
    filters: JSON.parse(localStorage.getItem('hololive_search_filters') || 'null') || {
        keyword: '',
        color: ['all'],
        cardType: ['all'],
        bloomLevel: ['all'],
    },
    pinnedCards: JSON.parse(localStorage.getItem('hololive_pinned_cards') || '[]') as Card[],
    selectedCard: JSON.parse(localStorage.getItem('hololive_selected_card') || 'null') as Card | null,
    overlayMode: (localStorage.getItem('hololive_overlay_mode') as 'on' | 'off') || 'off',
    overlayDisplayMode: (localStorage.getItem('hololive_overlay_display_mode') as 'image' | 'text') || 'image',
    spMarkerMode: (localStorage.getItem('hololive_sp_marker_mode') as 'off' | 'follow' | 'independent') || 'off',
    spMarkerFace: 'front' as 'front' | 'back',
    independentMarkerState: JSON.parse(localStorage.getItem('hololive_sp_marker_independent_state') || '{"px": 0.3, "py": 0.3, "scale": 0.5, "rotation": 0}'),
    showSPMarkerForceHidden: false, // Oキーによる強制非表示フラグ
    overlayForcedCard: null as Card | null,
    remoteCard: null as Card | null
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

const channel = new BroadcastChannel('remote_duel_sync');

const broadcast = () => {
    if (IS_OVERLAY) return;
    const effectiveCard = (sharedState.overlayMode !== 'off') ? (sharedState.overlayForcedCard || sharedState.selectedCard) : null;
    channel.postMessage({
        type: 'SYNC_STATE', state: {
            overlayMode: sharedState.overlayMode,
            overlayDisplayMode: sharedState.overlayDisplayMode,
            pinnedCards: sharedState.pinnedCards,
            spMarkerMode: sharedState.spMarkerMode,
            spMarkerFace: sharedState.spMarkerFace,
            independentMarkerState: sharedState.independentMarkerState,
            showSPMarkerForceHidden: sharedState.showSPMarkerForceHidden,
            card: effectiveCard
        }
    });
};

channel.onmessage = (e) => {
    const { type, state, value } = e.data;
    let changed = false;

    if (type === 'SYNC_STATE') {
        if (sharedState.overlayMode !== state.overlayMode) { sharedState.overlayMode = state.overlayMode; changed = true; }
        if (sharedState.overlayDisplayMode !== state.overlayDisplayMode) { sharedState.overlayDisplayMode = state.overlayDisplayMode; changed = true; }
        if (sharedState.spMarkerMode !== state.spMarkerMode) { sharedState.spMarkerMode = state.spMarkerMode; changed = true; }
        if (sharedState.spMarkerFace !== state.spMarkerFace) { sharedState.spMarkerFace = state.spMarkerFace; changed = true; }
        if (JSON.stringify(sharedState.independentMarkerState) !== JSON.stringify(state.independentMarkerState)) { sharedState.independentMarkerState = state.independentMarkerState; changed = true; }
        if (sharedState.showSPMarkerForceHidden !== state.showSPMarkerForceHidden) { sharedState.showSPMarkerForceHidden = state.showSPMarkerForceHidden; changed = true; }
        if (JSON.stringify(sharedState.pinnedCards) !== JSON.stringify(state.pinnedCards)) { sharedState.pinnedCards = state.pinnedCards; changed = true; }
        if (JSON.stringify(sharedState.remoteCard) !== JSON.stringify(state.card)) { sharedState.remoteCard = state.card; changed = true; }
    } else if (type === 'CMD_SET_FORCED') {
        if (!IS_OVERLAY) {
            sharedState.overlayForcedCard = value;
            changed = true;
            broadcast();
        }
    } else if (type === 'REQ_STATE') {
        if (!IS_OVERLAY) {
            sharedState.spMarkerFace = 'front';
            sharedState.showSPMarkerForceHidden = false; // Reset force-hidden when a new overlay starts
            broadcast();
        }
    }

    if (changed) notify();
};

if (IS_OVERLAY) channel.postMessage({ type: 'REQ_STATE' });

const updateShared = (updates: Partial<typeof sharedState>) => {
    let changed = false;
    for (const key in updates) {
        const k = key as keyof typeof sharedState;
        if (JSON.stringify(sharedState[k]) === JSON.stringify(updates[k])) continue;
        (sharedState as any)[k] = updates[k];
        changed = true;

        if (!IS_OVERLAY) {
            if (k === 'filters') localStorage.setItem('hololive_search_filters', JSON.stringify(sharedState.filters));
            if (k === 'pinnedCards') localStorage.setItem('hololive_pinned_cards', JSON.stringify(sharedState.pinnedCards));
            if (k === 'selectedCard') localStorage.setItem('hololive_selected_card', JSON.stringify(sharedState.selectedCard));
            if (k === 'overlayMode') localStorage.setItem('hololive_overlay_mode', sharedState.overlayMode);
            if (k === 'overlayDisplayMode') localStorage.setItem('hololive_overlay_display_mode', sharedState.overlayDisplayMode);
            if (k === 'spMarkerMode') {
                localStorage.setItem('hololive_sp_marker_mode', sharedState.spMarkerMode);
                sharedState.showSPMarkerForceHidden = false; // Reset force-hidden when mode changed by badge/click
                if (updates.spMarkerMode !== 'off') {
                    sharedState.spMarkerFace = 'front'; // Reset to front when enabled
                }
            }
            if (k === 'independentMarkerState') localStorage.setItem('hololive_sp_marker_independent_state', JSON.stringify(sharedState.independentMarkerState));
        }
    }

    if (changed) {
        notify();
        if (!IS_OVERLAY) broadcast();
        else if (updates.overlayForcedCard !== undefined) {
            channel.postMessage({ type: 'CMD_SET_FORCED', value: updates.overlayForcedCard });
        } else if (updates.spMarkerFace !== undefined || updates.independentMarkerState !== undefined || updates.showSPMarkerForceHidden !== undefined) {
            // Overlay can update face or independent position too, but typically it's from shortcuts or dragging
            // Let's broadcast back if overlay changes these
            channel.postMessage({
                type: 'SYNC_STATE', state: {
                    ...sharedState,
                    card: sharedState.remoteCard // Ensure remoteCard is sent as 'card'
                }
            });
        }
    }
};

// --- HOOK ---
export const useCardSearch = () => {
    const [, setTick] = useState(0);
    const forceUpdate = useCallback(() => setTick(t => t + 1), []);

    useEffect(() => {
        listeners.add(forceUpdate);
        return () => { listeners.delete(forceUpdate); };
    }, [forceUpdate]);

    const normalizedData = useMemo(() => {
        const base = import.meta.env.BASE_URL;
        return (cardDataOriginal as Card[]).map(card => {
            let resolvedImageUrl = card.imageUrl;
            if (resolvedImageUrl && !resolvedImageUrl.startsWith('http')) {
                let path = resolvedImageUrl;
                if (path.startsWith(base)) path = path.slice(base.length);
                if (path.startsWith('/')) path = path.slice(1);
                resolvedImageUrl = base + path;
            }
            const normName = normalizeText(card.name);
            return {
                ...card,
                resolvedImageUrl,
                _normName: normName,
                _hiraName: toHiragana(normName),
                _pureName: removeSymbols(normName),
                _pureHira: removeSymbols(toHiragana(normName))
            };
        });
    }, []);

    const filteredCards = useMemo(() => {
        const { keyword, color, cardType, bloomLevel } = sharedState.filters;
        const normKeyword = keyword ? normalizeText(keyword) : '';
        const hiraKeyword = keyword ? toHiragana(normKeyword) : '';
        const pureKeyword = normKeyword ? removeSymbols(normKeyword) : '';
        const selectedColors = color.filter((s: string) => s !== 'all');
        const selectedTypes = cardType.filter((s: string) => s !== 'all');
        const selectedBlooms = bloomLevel.filter((s: string) => s !== 'all');

        return normalizedData.filter(card => {
            if (card.cardType === 'エール') return false;
            if (normKeyword) {
                if (!(card._normName?.includes(normKeyword) || card._hiraName?.includes(hiraKeyword) || (pureKeyword && (card._pureName?.includes(pureKeyword) || card._pureHira?.includes(pureKeyword))))) return false;
            }
            if (selectedColors.length > 0) {
                const isMulti = card.color.length >= 2;
                const match = selectedColors.includes('multi') ? isMulti : (selectedColors.includes('colorless') ? card.color === '◇' : selectedColors.some((c: string) => card.color.includes(c)));
                if (!match) return false;
            }
            if (selectedTypes.length > 0) {
                const match = selectedTypes.some((t: string) => t === 'サポート' ? card.cardType.startsWith('サポート') : (t === 'LIMITED' ? card.cardType.includes('LIMITED') : card.cardType === t));
                if (!match) return false;
            }
            if (selectedBlooms.length > 0 && (card.bloomLevel === undefined || !selectedBlooms.includes(card.bloomLevel))) return false;
            return true;
        });
    }, [normalizedData, sharedState.filters]);

    const updateFilter = useCallback((category: FilterCategory, value: string) => {
        const current = sharedState.filters[category];
        let next = value === 'all' ? ['all'] : (current.includes(value) ? current.filter((v: string) => v !== value) : [...current.filter((v: string) => v !== 'all'), value]);
        if (next.length === 0) next = ['all'];
        updateShared({ filters: { ...sharedState.filters, [category]: next } });
    }, []);

    const setKeyword = useCallback((keyword: string) => updateShared({ filters: { ...sharedState.filters, keyword } }), []);
    const togglePin = useCallback((card: Card) => {
        const exists = sharedState.pinnedCards.some(c => c.id === card.id);
        if (exists) updateShared({ pinnedCards: sharedState.pinnedCards.filter(c => c.id !== card.id) });
        else if (sharedState.pinnedCards.length < 1000) updateShared({ pinnedCards: [...sharedState.pinnedCards, card] });
        else alert('ピン留めできるのは1000枚までです。');
    }, []);

    const resetPins = useCallback(() => updateShared({ pinnedCards: [] }), []);
    const reorderPins = useCallback((startIndex: number, endIndex: number) => {
        const result = Array.from(sharedState.pinnedCards);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        updateShared({ pinnedCards: result });
    }, []);
    const setSelectedCard = useCallback((card: Card | null) => updateShared({ selectedCard: card }), []);
    const setOverlayForcedCard = useCallback((card: Card | null) => updateShared({ overlayForcedCard: card }), []);
    const setOverlayDisplayMode = useCallback((mode: 'image' | 'text') => updateShared({ overlayDisplayMode: mode }), []);
    const toggleOverlayMode = useCallback(() => updateShared({ overlayMode: sharedState.overlayMode === 'off' ? 'on' : 'off' }), []);
    const toggleOverlayDisplayMode = useCallback(() => updateShared({ overlayDisplayMode: sharedState.overlayDisplayMode === 'image' ? 'text' : 'image' }), []);
    const toggleSPMarkerMode = useCallback(() => {
        const modes: Array<'off' | 'follow' | 'independent'> = ['off', 'follow', 'independent'];
        const nextIndex = (modes.indexOf(sharedState.spMarkerMode) + 1) % modes.length;
        updateShared({ spMarkerMode: modes[nextIndex] });
    }, []);

    const toggleSPMarkerFace = useCallback(() => {
        updateShared({ spMarkerFace: sharedState.spMarkerFace === 'front' ? 'back' : 'front' });
    }, []);

    const toggleSPMarkerForceHidden = useCallback(() => {
        updateShared({ showSPMarkerForceHidden: !sharedState.showSPMarkerForceHidden });
    }, []);

    const updateIndependentMarkerState = useCallback((s: any) => {
        updateShared({ independentMarkerState: s });
    }, []);

    return {
        filters: sharedState.filters,
        filteredCards,
        pinnedCards: sharedState.pinnedCards,
        pinnedIds: useMemo(() => new Set(sharedState.pinnedCards.map(c => c.id)), [sharedState.pinnedCards]),
        selectedCard: sharedState.selectedCard,
        overlayCard: IS_OVERLAY ? sharedState.remoteCard : (sharedState.overlayMode !== 'off' ? (sharedState.overlayForcedCard || sharedState.selectedCard) : null),
        overlayMode: sharedState.overlayMode,
        overlayDisplayMode: sharedState.overlayDisplayMode,
        spMarkerMode: sharedState.spMarkerMode,
        spMarkerFace: sharedState.spMarkerFace,
        independentMarkerState: sharedState.independentMarkerState,
        overlayForcedCard: sharedState.overlayForcedCard,
        updateFilter,
        setKeyword,
        togglePin,
        resetPins,
        reorderPins,
        setSelectedCard,
        setOverlayForcedCard,
        setOverlayDisplayMode,
        toggleOverlayMode,
        toggleOverlayDisplayMode,
        toggleSPMarkerMode,
        toggleSPMarkerFace,
        toggleSPMarkerForceHidden,
        showSPMarkerForceHidden: sharedState.showSPMarkerForceHidden,
        updateIndependentMarkerState,
        searchKey: `${sharedState.filters.keyword}-${sharedState.filters.color.join(',')}-${sharedState.filters.cardType.join(',')}-${sharedState.filters.bloomLevel.join(',')}`
    };
};
