import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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

// --- SYNC MANAGER (Singleton to avoid hook-instance loops) ---
const isOverlayWindow = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'overlay';

const shared = {
    filters: JSON.parse(localStorage.getItem('hololive_search_filters') || 'null') || {
        keyword: '',
        color: ['all'],
        cardType: ['all'],
        bloomLevel: ['all'],
    },
    pinnedCards: JSON.parse(localStorage.getItem('hololive_pinned_cards') || '[]'),
    selectedCard: JSON.parse(localStorage.getItem('hololive_selected_card') || 'null'),
    overlayMode: (localStorage.getItem('hololive_overlay_mode') as 'on' | 'off') || 'off',
    overlayDisplayMode: (localStorage.getItem('hololive_overlay_display_mode') as 'image' | 'text') || 'image',
    overlayForcedCard: null as Card | null,
    remoteOverlayCard: null as Card | null
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

const channel = new BroadcastChannel('remote_duel_sync');

const broadcastAuth = () => {
    if (isOverlayWindow) return;
    const card = (shared.overlayMode !== 'off') ? (shared.overlayForcedCard || shared.selectedCard) : null;
    channel.postMessage({ type: 'HOLOLIVE_OVERLAY_STATE_UPDATE', value: shared.overlayMode });
    channel.postMessage({ type: 'HOLOLIVE_OVERLAY_DISPLAY_MODE_UPDATE', value: shared.overlayDisplayMode });
    channel.postMessage({ type: 'HOLOLIVE_OVERLAY_CARD_UPDATE', value: card });
    channel.postMessage({ type: 'HOLOLIVE_PINNED_CARDS_UPDATE', value: shared.pinnedCards });
};

channel.onmessage = (event: MessageEvent) => {
    const { type, value } = event.data;
    let changed = false;

    if (type === 'HOLOLIVE_OVERLAY_STATE_UPDATE') {
        if (shared.overlayMode !== value) { shared.overlayMode = value; changed = true; }
    } else if (type === 'HOLOLIVE_OVERLAY_DISPLAY_MODE_UPDATE') {
        if (shared.overlayDisplayMode !== value) { shared.overlayDisplayMode = value; changed = true; }
    } else if (type === 'HOLOLIVE_OVERLAY_CARD_UPDATE') {
        const isSame = (!shared.remoteOverlayCard && !value) ||
            (shared.remoteOverlayCard && value && shared.remoteOverlayCard.id === value.id && shared.remoteOverlayCard.imageUrl === value.imageUrl);
        if (!isSame) { shared.remoteOverlayCard = value; changed = true; }
    } else if (type === 'HOLOLIVE_PINNED_CARDS_UPDATE') {
        const isSame = shared.pinnedCards.length === value.length && (value.length === 0 || shared.pinnedCards[0].id === value[0].id);
        if (!isSame) { shared.pinnedCards = value; changed = true; }
    } else if (type === 'HOLOLIVE_CMD_SET_FORCED_CARD') {
        if (!isOverlayWindow) {
            shared.overlayForcedCard = value;
            changed = true;
            broadcastAuth();
        }
    } else if (type === 'REQUEST_STATE') {
        if (!isOverlayWindow) broadcastAuth();
    }

    if (changed) notify();
};

if (isOverlayWindow) {
    channel.postMessage({ type: 'REQUEST_STATE' });
}

const updateShared = (updates: Partial<typeof shared>, skipBroadcast = false) => {
    let changed = false;
    for (const key in updates) {
        const k = key as keyof typeof shared;
        if (shared[k] === updates[k]) continue;
        (shared as any)[k] = updates[k];
        changed = true;

        if (!isOverlayWindow) {
            if (k === 'filters') localStorage.setItem('hololive_search_filters', JSON.stringify(shared.filters));
            if (k === 'pinnedCards') localStorage.setItem('hololive_pinned_cards', JSON.stringify(shared.pinnedCards));
            if (k === 'selectedCard') localStorage.setItem('hololive_selected_card', JSON.stringify(shared.selectedCard));
            if (k === 'overlayMode') localStorage.setItem('hololive_overlay_mode', shared.overlayMode);
            if (k === 'overlayDisplayMode') localStorage.setItem('hololive_overlay_display_mode', shared.overlayDisplayMode);
        }
    }

    if (changed) {
        notify();
        if (!skipBroadcast) {
            if (!isOverlayWindow) broadcastAuth();
            else if (updates.overlayForcedCard !== undefined) {
                channel.postMessage({ type: 'HOLOLIVE_CMD_SET_FORCED_CARD', value: updates.overlayForcedCard });
            }
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
        const { keyword, color, cardType, bloomLevel } = shared.filters;
        const normKeyword = keyword ? normalizeText(keyword) : '';
        const hiraKeyword = keyword ? toHiragana(normKeyword) : '';
        const pureKeyword = normKeyword ? removeSymbols(normKeyword) : '';
        const selectedColors = color.filter(s => s !== 'all');
        const selectedTypes = cardType.filter(s => s !== 'all');
        const selectedBlooms = bloomLevel.filter(s => s !== 'all');
        return normalizedData.filter(card => {
            if (card.cardType === 'エール') return false;
            if (normKeyword) {
                const matches = (card._normName?.includes(normKeyword)) || (card._hiraName?.includes(hiraKeyword)) ||
                    (pureKeyword && (card._pureName?.includes(pureKeyword) || card._pureHira?.includes(pureKeyword)));
                if (!matches) return false;
            }
            if (selectedColors.length > 0) {
                const isMulti = card.color.length >= 2;
                const isMono = card.color.length === 1;
                const isColorless = card.color === '◇';
                let match = false;
                if (selectedColors.includes('multi') && isMulti) match = true;
                if (selectedColors.includes('not_multi') && isMono) match = true;
                if (selectedColors.includes('colorless') && isColorless) match = true;
                if (!match && selectedColors.some(c => card.color.includes(c))) match = true;
                if (!match) return false;
            }
            if (selectedTypes.length > 0) {
                let match = selectedTypes.some(t => {
                    if (t === 'サポート') return card.cardType.startsWith('サポート');
                    if (t === 'LIMITED') return card.cardType.includes('LIMITED');
                    return card.cardType === t;
                });
                if (!match) return false;
            }
            if (selectedBlooms.length > 0 && (card.bloomLevel === undefined || !selectedBlooms.includes(card.bloomLevel))) return false;
            return true;
        });
    }, [normalizedData, shared.filters]);

    const updateFilter = useCallback((category: FilterCategory, value: string) => {
        const current = shared.filters[category];
        let next;
        if (value === 'all') next = ['all'];
        else if (current.includes(value)) {
            next = current.filter(v => v !== value);
            if (next.length === 0) next = ['all'];
        } else {
            next = [...current.filter(v => v !== 'all'), value];
        }
        updateShared({ filters: { ...shared.filters, [category]: next } });
    }, []);

    const setKeyword = useCallback((keyword: string) => updateShared({ filters: { ...shared.filters, keyword } }), []);
    const togglePin = useCallback((card: Card) => {
        const exists = shared.pinnedCards.some(c => c.id === card.id);
        if (exists) updateShared({ pinnedCards: shared.pinnedCards.filter(c => c.id !== card.id) });
        else if (shared.pinnedCards.length < 100) updateShared({ pinnedCards: [...shared.pinnedCards, card] });
        else alert('ピン留めできるのは100枚までです。');
    }, []);
    const resetPins = useCallback(() => updateShared({ pinnedCards: [] }), []);
    const setSelectedCard = useCallback((card: Card | null) => updateShared({ selectedCard: card }), []);
    const setOverlayForcedCard = useCallback((card: Card | null) => updateShared({ overlayForcedCard: card }), []);
    const setOverlayDisplayMode = useCallback((mode: 'image' | 'text') => updateShared({ overlayDisplayMode: mode }), []);
    const toggleOverlayMode = useCallback(() => updateShared({ overlayMode: shared.overlayMode === 'off' ? 'on' : 'off' }), []);
    const toggleOverlayDisplayMode = useCallback(() => updateShared({ overlayDisplayMode: shared.overlayDisplayMode === 'image' ? 'text' : 'image' }), []);

    return {
        filters: shared.filters,
        filteredCards,
        pinnedCards: shared.pinnedCards,
        pinnedIds: useMemo(() => new Set(shared.pinnedCards.map(c => c.id)), [shared.pinnedCards]),
        selectedCard: shared.selectedCard,
        overlayCard: isOverlayWindow ? shared.remoteOverlayCard : (shared.overlayMode !== 'off' ? (shared.overlayForcedCard || shared.selectedCard) : null),
        overlayMode: shared.overlayMode,
        overlayDisplayMode: shared.overlayDisplayMode,
        overlayForcedCard: shared.overlayForcedCard,
        updateFilter,
        setKeyword,
        togglePin,
        resetPins,
        setSelectedCard,
        setOverlayForcedCard,
        setOverlayDisplayMode,
        toggleOverlayMode,
        toggleOverlayDisplayMode,
        searchKey: `${shared.filters.keyword}-${shared.filters.color.join(',')}-${shared.filters.cardType.join(',')}-${shared.filters.bloomLevel.join(',')}`
    };
};
