import { useState, useMemo, useEffect, useRef } from 'react';
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

export const useCardSearch = () => {
    const [filters, setFilters] = useState<Filters>(() => {
        const saved = localStorage.getItem('hololive_search_filters');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse filters', e);
            }
        }
        return {
            keyword: '',
            color: ['all'],
            cardType: ['all'],
            bloomLevel: ['all'],
        };
    });

    const [pinnedCards, setPinnedCards] = useState<Card[]>(() => {
        const saved = localStorage.getItem('hololive_pinned_cards');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse pins', e);
            }
        }
        return [];
    });

    const pinnedIds = useMemo(() => new Set(pinnedCards.map(c => c.id)), [pinnedCards]);

    useEffect(() => {
        localStorage.setItem('hololive_search_filters', JSON.stringify(filters));
    }, [filters]);

    useEffect(() => {
        localStorage.setItem('hololive_pinned_cards', JSON.stringify(pinnedCards));
    }, [pinnedCards]);

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

    const searchKey = useMemo(() => {
        return `${filters.keyword}-${filters.color.join(',')}-${filters.cardType.join(',')}-${filters.bloomLevel.join(',')}`;
    }, [filters]);

    const filteredCards = useMemo(() => {
        const rawKeyword = filters.keyword;
        const normKeyword = rawKeyword ? normalizeText(rawKeyword) : '';
        const hiraKeyword = rawKeyword ? toHiragana(normKeyword || '') : '';
        const pureKeyword = normKeyword ? removeSymbols(normKeyword) : '';

        const selectedColors = filters.color.filter(s => s !== 'all');
        const hasColorFilter = selectedColors.length > 0;
        const colorSpecial = selectedColors.filter(s => s !== 'multi' && s !== 'not_multi' && s !== 'colorless');

        const selectedTypes = filters.cardType.filter(s => s !== 'all');
        const hasTypeFilter = selectedTypes.length > 0;

        const selectedBlooms = filters.bloomLevel.filter(s => s !== 'all');
        const hasBloomFilter = selectedBlooms.length > 0;

        return normalizedData.filter(card => {
            if (card.cardType === 'エール') return false;

            if (normKeyword) {
                const matchesNorm = card._normName?.includes(normKeyword);
                const matchesHira = card._hiraName?.includes(hiraKeyword);
                const matchesPure = pureKeyword && (
                    (card as any)._pureName?.includes(pureKeyword) ||
                    (card as any)._pureHira?.includes(pureKeyword)
                );

                if (!matchesNorm && !matchesHira && !matchesPure) {
                    return false;
                }
            }

            if (hasColorFilter) {
                const colorLen = card.color.length;
                const isMulti = colorLen >= 2;
                const isMono = colorLen === 1;
                const isColorless = card.color === '◇';

                let colorMatch = false;
                if (selectedColors.includes('multi') && isMulti) colorMatch = true;
                if (selectedColors.includes('not_multi') && isMono) colorMatch = true;
                if (selectedColors.includes('colorless') && isColorless) colorMatch = true;
                if (!colorMatch && colorSpecial.some(c => card.color.includes(c))) colorMatch = true;

                if (!colorMatch) return false;
            }

            if (hasTypeFilter) {
                let typeMatch = false;
                // 'サポート' matches anything starting with 'サポート' (Item, Event, Tool, Mascot, Fan, etc.)
                if (selectedTypes.includes('サポート') && card.cardType.startsWith('サポート')) typeMatch = true;
                // 'LIMITED' matches anything containing 'LIMITED'
                if (selectedTypes.includes('LIMITED') && card.cardType.includes('LIMITED')) typeMatch = true;
                // Others match exactly
                if (!typeMatch && selectedTypes.includes(card.cardType)) typeMatch = true;

                if (!typeMatch) return false;
            }

            if (hasBloomFilter) {
                if (card.bloomLevel === undefined || !selectedBlooms.includes(card.bloomLevel)) {
                    return false;
                }
            }

            return true;
        });
    }, [normalizedData, filters]);

    const updateFilter = (category: FilterCategory, value: string) => {
        setFilters(prev => {
            const current = prev[category];
            if (value === 'all') return { ...prev, [category]: ['all'] };

            let next;
            if (current.includes(value)) {
                next = current.filter(v => v !== value);
                if (next.length === 0) next = ['all'];
            } else {
                next = [...current.filter(v => v !== 'all'), value];
            }
            return { ...prev, [category]: next };
        });
    };

    const setKeyword = (keyword: string) => {
        setFilters(prev => ({ ...prev, keyword }));
    };

    const togglePin = (card: Card) => {
        setPinnedCards(prev => {
            const exists = prev.some(c => c.id === card.id);
            if (exists) return prev.filter(c => c.id !== card.id);
            if (prev.length >= 100) {
                alert('ピン留めできるのは100枚までです。');
                return prev;
            }
            return [...prev, card];
        });
    };

    const resetPins = () => setPinnedCards([]);

    const isOverlayWindow = useMemo(() =>
        typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'overlay'
        , []);

    const [selectedCard, setSelectedCard] = useState<Card | null>(() => {
        const saved = localStorage.getItem('hololive_selected_card');
        return saved ? JSON.parse(saved) : null;
    });

    const [overlayMode, setOverlayMode] = useState<'off' | 'on' | 'rotated'>(() => {
        const saved = localStorage.getItem('hololive_overlay_mode');
        if (saved === 'on' || saved === 'rotated' || saved === 'off') return saved;
        return 'off';
    });

    const [remoteOverlayCard, setRemoteOverlayCard] = useState<Card | null>(null);

    const channelRef = useRef<BroadcastChannel | null>(null);

    useEffect(() => {
        channelRef.current = new BroadcastChannel('remote_duel_sync');

        const channel = channelRef.current;
        const handleMessage = (event: MessageEvent) => {
            const { type, value } = event.data;
            if (type === 'HOLOLIVE_OVERLAY_STATE_UPDATE') {
                setOverlayMode(prev => prev !== value ? value : prev);
            }
            if (type === 'HOLOLIVE_OVERLAY_CARD_UPDATE') {
                setRemoteOverlayCard(prev => {
                    if (!prev && !value) return null;
                    if (prev && value && prev.id === value.id && prev.imageUrl === value.imageUrl) return prev;
                    return value;
                });
            }
            if (!isOverlayWindow && type === 'REQUEST_STATE') {
                channel.postMessage({ type: 'HOLOLIVE_OVERLAY_STATE_UPDATE', value: overlayMode });
                channel.postMessage({ type: 'HOLOLIVE_OVERLAY_CARD_UPDATE', value: (overlayMode !== 'off') ? selectedCard : null });
            }
        };

        channel.onmessage = handleMessage;
        if (isOverlayWindow) {
            channel.postMessage({ type: 'REQUEST_STATE' });
        }

        return () => {
            channel.close();
            channelRef.current = null;
        };
    }, [isOverlayWindow, overlayMode, selectedCard]);

    useEffect(() => {
        if (isOverlayWindow || !channelRef.current) return;

        localStorage.setItem('hololive_overlay_mode', overlayMode);
        if (selectedCard) {
            localStorage.setItem('hololive_selected_card', JSON.stringify(selectedCard));
        } else {
            localStorage.removeItem('hololive_selected_card');
        }

        channelRef.current.postMessage({ type: 'HOLOLIVE_OVERLAY_STATE_UPDATE', value: overlayMode });
        channelRef.current.postMessage({ type: 'HOLOLIVE_OVERLAY_CARD_UPDATE', value: (overlayMode !== 'off') ? selectedCard : null });
    }, [overlayMode, selectedCard, isOverlayWindow]);

    const toggleOverlayMode = () => {
        setOverlayMode(prev => {
            if (prev === 'off') return 'on';
            if (prev === 'on') return 'rotated';
            return 'off';
        });
    };

    const overlayCard = isOverlayWindow ? remoteOverlayCard : (overlayMode !== 'off' ? selectedCard : null);

    return {
        filters,
        searchKey,
        filteredCards,
        pinnedCards,
        pinnedIds,
        selectedCard,
        overlayCard,
        overlayMode,
        updateFilter,
        setKeyword,
        togglePin,
        resetPins,
        setSelectedCard,
        toggleOverlayMode
    };
};
