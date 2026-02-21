import React, { useState, useEffect } from 'react';
import type { FilterCategory, Filters } from '../../hooks/useCardSearch';
import { ArrowUpToLine, ArrowDownToLine } from 'lucide-react';

interface FilterPanelProps {
    filters: Filters;
    options: Record<string, string[]>;
    onUpdate: (category: FilterCategory, value: string) => void;
    onKeywordChange: (text: string) => void;
    onScrollTop: () => void;
    onScrollBottom: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
    filters,
    options,
    onUpdate,
    onKeywordChange,
    onScrollTop,
    onScrollBottom
}) => {
    const [activeTab, setActiveTab] = useState<string>('');

    // Initialize activeTab when options are loaded
    useEffect(() => {
        if (!activeTab && Object.keys(options).length > 0) {
            const keys = Object.keys(options);
            // Just pick the first available category
            setActiveTab(keys[0]);
        }
    }, [options, activeTab]);

    // -- STYLES --
    const tabStyle = (isActive: boolean): React.CSSProperties => ({
        flex: 1,
        width: 0,
        minWidth: 0,
        textAlign: 'center',
        padding: '10px 0',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '12px',
        color: isActive ? '#22d3ee' : '#9ca3af',
        borderBottom: isActive ? '2px solid #22d3ee' : '2px solid transparent',
        backgroundColor: isActive ? 'rgba(8, 145, 178, 0.1)' : 'transparent',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    });

    const buttonStyle = (isSelected: boolean): React.CSSProperties => {
        const base: React.CSSProperties = {
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 'bold',
            border: '1px solid',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            margin: '2px',
            boxSizing: 'border-box',
        };

        if (isSelected) {
            // All tabs: Default Cyan theme
            const bg = '#0891b2';
            const shadow = '0 0 10px rgba(6,182,212,0.6), 0 0 4px rgba(6,182,212,0.8)';
            const textColor = '#fff';

            return {
                ...base,
                background: bg,
                boxShadow: shadow,
                color: textColor,
                borderColor: 'transparent',
            };
        } else {
            return {
                ...base,
                backgroundColor: '#1f2937',
                color: '#9ca3af',
                borderColor: '#374151',
            };
        }
    };

    const hasActiveFilters = (cat: string) => {
        const s = filters.categories[cat];
        return s && s.length > 0 && !s.includes('all');
    };

    const optionKeys = Object.keys(options);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '4px' }}>
                <input
                    type="text"
                    placeholder="カード名で検索..."
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
                        boxSizing: 'border-box',
                    }}
                    className="focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
            </div>

            {/* Dynamic Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #374151', overflowX: 'auto' }} className="scrollbar-none">
                {optionKeys.map(cat => (
                    <div
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        style={tabStyle(activeTab === cat)}
                    >
                        <div style={{ position: 'relative', display: 'inline-block', padding: '0 8px' }}>
                            {cat}
                            {hasActiveFilters(cat) && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    right: '-2px',
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
                    {activeTab && options[activeTab] && (
                        <>
                            <button
                                style={buttonStyle((filters.categories[activeTab] || ['all']).includes('all'))}
                                onClick={() => onUpdate(activeTab, 'all')}
                            >
                                すべて
                            </button>
                            {options[activeTab].map(val => {
                                const isSelected = (filters.categories[activeTab] || []).includes(val);
                                return (
                                    <button
                                        key={val}
                                        style={buttonStyle(isSelected)}
                                        onClick={() => onUpdate(activeTab, val)}
                                    >
                                        {val}
                                    </button>
                                );
                            })}
                        </>
                    )}
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

