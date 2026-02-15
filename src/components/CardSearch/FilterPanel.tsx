import React, { useState } from 'react';
import type { FilterCategory, Filters } from '../../hooks/useCardSearch';
import { ArrowUpToLine, ArrowDownToLine } from 'lucide-react';

interface FilterPanelProps {
    filters: Filters;
    onUpdate: (category: FilterCategory, value: string) => void;
    onKeywordChange: (text: string) => void;
    onScrollTop: () => void;
    onScrollBottom: () => void;
}

const FILTER_OPTIONS = {
    color: [
        { label: 'すべて', value: 'all' },
        { label: '白', value: '白' },
        { label: '緑', value: '緑' },
        { label: '赤', value: '赤' },
        { label: '青', value: '青' },
        { label: '紫', value: '紫' },
        { label: '黄', value: '黄' },
        { label: '無', value: 'colorless' },
        { label: '単色', value: 'not_multi' },
        { label: '多色', value: 'multi' },
    ],
    cardType: [
        { label: 'すべて', value: 'all' },
        { label: 'ホロメン', value: 'ホロメン' },
        { label: 'Buzz', value: 'Buzzホロメン' },
        { label: '推し', value: '推しホロメン' },
        { label: 'サポート', value: 'サポート' },
        { label: 'LIMITED', value: 'LIMITED' },
    ],
    bloomLevel: [
        { label: 'すべて', value: 'all' },
        { label: 'Debut', value: 'Debut' },
        { label: '1st', value: '1st' },
        { label: '2nd', value: '2nd' },
        { label: 'Spot', value: 'Spot' },
    ]
};

export const FilterPanel: React.FC<FilterPanelProps> = ({
    filters,
    onUpdate,
    onKeywordChange,
    onScrollTop,
    onScrollBottom
}) => {
    const [activeTab, setActiveTab] = useState<FilterCategory>('color');

    // -- STYLES --
    const tabStyle = (isActive: boolean): React.CSSProperties => ({
        flex: 1,
        width: 0, // Force equal width
        minWidth: 0, // Allow shrinking below content size if needed
        textAlign: 'center',
        padding: '10px 0',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '12px',
        color: isActive ? '#22d3ee' : '#9ca3af', // Cyan-400 : Gray-400
        borderBottom: isActive ? '2px solid #22d3ee' : '2px solid transparent',
        backgroundColor: isActive ? 'rgba(8, 145, 178, 0.1)' : 'transparent',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap', // Prevent text wrapping
        overflow: 'hidden', // Hide overflow
        textOverflow: 'ellipsis', // Add ellipsis if too long
    });

    const buttonStyle = (isSelected: boolean, colorValue?: string): React.CSSProperties => {
        const base: React.CSSProperties = {
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 'bold',
            border: '1px solid',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            margin: '2px', // Slight margin for safety
            boxSizing: 'border-box',
        };

        if (isSelected) {
            let bg = '#2563eb'; // Default Blue
            let shadow = '0 0 10px rgba(37, 99, 235, 0.6)';
            if (activeTab === 'color') {
                switch (colorValue) {
                    case 'all': bg = '#0891b2'; shadow = '0 0 10px rgba(6,182,212,0.6), 0 0 4px rgba(6,182,212,0.8)'; break;
                    case '白': bg = '#e5e7eb'; shadow = '0 0 10px rgba(255,255,255,0.6)'; break;
                    case '緑': bg = '#16a34a'; shadow = '0 0 10px rgba(22,163,74,0.6)'; break;
                    case '赤': bg = '#dc2626'; shadow = '0 0 10px rgba(220,38,38,0.6)'; break;
                    case '青': bg = '#2563eb'; shadow = '0 0 10px rgba(37,99,235,0.6)'; break;
                    case '紫': bg = '#9333ea'; shadow = '0 0 10px rgba(147,51,234,0.6)'; break;
                    case '黄': bg = '#eab308'; shadow = '0 0 10px rgba(234,179,8,0.6)'; break;
                    case 'colorless': bg = '#6b7280'; shadow = '0 0 10px rgba(107,114,128,0.6)'; break;
                    case 'multi':
                        bg = 'linear-gradient(to right, #ef4444, #22c55e, #3b82f6)';
                        shadow = '0 0 10px rgba(236,72,153,0.5)';
                        break;
                }
                // White text for most selected, Black for White/Yellow
                if (colorValue === '白' || colorValue === '黄') base.color = '#000';
                else base.color = '#fff';
            } else {
                // Non-color tabs: Cyan theme + Glow
                bg = '#0891b2'; // Cyan-600
                shadow = '0 0 10px rgba(6,182,212,0.6), 0 0 4px rgba(6,182,212,0.8)';
                base.color = '#fff';
            }

            return {
                ...base,
                background: bg,
                boxShadow: shadow,
                borderColor: 'transparent', // Use transparent for all selected states for consistency
            };
        } else {
            // Unselected
            return {
                ...base,
                backgroundColor: '#1f2937', // Gray-800
                color: '#9ca3af', // Gray-400
                borderColor: '#374151', // Gray-700
            };
        }
    };

    // Helper to check for active dot
    const hasActiveFilters = (cat: FilterCategory) => {
        const s = filters[cat];
        return s && s.length > 0 && !s.includes('all');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '4px' }}>
                <input
                    type="text"
                    placeholder="カード名・No.で検索..."
                    value={filters.keyword}
                    onChange={(e) => onKeywordChange(e.target.value)}
                    style={{
                        width: '100%',
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        color: '#fff',
                        borderRadius: '9999px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        outline: 'none',
                    }}
                    className="focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
            </div>

            {/* Fixed Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #374151' }}>
                {(['color', 'cardType', 'bloomLevel'] as FilterCategory[]).map(cat => (
                    <div
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        style={tabStyle(activeTab === cat)}
                    >
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            {cat === 'color' ? '色' : cat === 'cardType' ? 'タイプ' : 'Bloom'}
                            {hasActiveFilters(cat) && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    right: '-6px',
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: '#22d3ee',
                                    boxShadow: '0 0 6px #22d3ee'
                                }} />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Buttons & Scroll Controls */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingTop: '8px' }}>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {FILTER_OPTIONS[activeTab].map(opt => {
                        const isSelected = filters[activeTab]?.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                style={buttonStyle(isSelected, opt.value)}
                                onClick={() => onUpdate(activeTab, opt.value)}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>

                {/* Scroll Buttons */}
                <div className="flex flex-none gap-1">
                    <button
                        onClick={onScrollTop}
                        style={{ ...buttonStyle(false), padding: '6px 10px' }}
                        className="hover:border-cyan-500 hover:text-cyan-400 transition-colors"
                        title="一番上へ"
                    >
                        <ArrowUpToLine size={16} />
                    </button>
                    <button
                        onClick={onScrollBottom}
                        style={{ ...buttonStyle(false), padding: '6px 10px' }}
                        className="hover:border-cyan-500 hover:text-cyan-400 transition-colors"
                        title="一番下へ"
                    >
                        <ArrowDownToLine size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
