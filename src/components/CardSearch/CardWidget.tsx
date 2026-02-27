import React, { useState, useEffect } from 'react';
import { useCardSearch } from '../../hooks/useCardSearch';
import { FolderOpen, Search, ExternalLink, RefreshCw, Image, Unlock, Layout, Layers, FolderSearch } from 'lucide-react';
import { useWidgetStore } from '../../store/useWidgetStore';

export const OVERLAY_CARD_RADIUS = '17px';

interface CardWidgetProps {
    hasAccess?: boolean;
    isScanning?: boolean;
    savedRootName?: string | null;
    onRequestAccess?: () => void;
    onVerifyPermission?: () => void;
    onSelectSimpleCard?: () => void;
    onDropFile?: (file: File) => void;
    onDropFolder?: (handle: FileSystemDirectoryHandle) => void;
}

export const CardWidget: React.FC<CardWidgetProps> = ({
    hasAccess = false,
    isScanning = false,
    savedRootName = null,
    onRequestAccess = () => { },
    onVerifyPermission = () => { },
    onSelectSimpleCard = () => { },
    onDropFile = () => { },
    onDropFolder = () => { }
}) => {
    const {
        selectedCard,
        pinnedCards,
        overlayMode,
        displayCardNo
    } = useCardSearch();

    const cardMode = useWidgetStore(s => s.settings.cardMode);
    const setSettings = useWidgetStore(s => s.setSettings);
    const simpleCardImageUrl = useWidgetStore(s => s.simpleCardImageUrl);
    const simpleCardImageName = useWidgetStore(s => s.settings.simpleCardImage?.name);

    const [dragOverType, setDragOverType] = React.useState<'none' | 'image' | 'folder'>('none');
    const dragCounter = React.useRef(0);

    // オーバーレイ表示自体がOFFの場合は何も表示しない
    if (overlayMode === 'off') return null;

    // 表示対象の決定ロジック
    let targetCard = null;
    let imageUrl = null;
    let cardName = "";

    if (cardMode === 'simple') {
        imageUrl = simpleCardImageUrl;
        cardName = simpleCardImageName || "カスタム画像";
    } else {
        const hasPins = pinnedCards && pinnedCards.length > 0;

        if (!hasPins) {
            targetCard = selectedCard;
        } else {
            if (displayCardNo === 0) {
                targetCard = selectedCard;
            } else {
                targetCard = pinnedCards[displayCardNo - 1];
            }
        }
        imageUrl = targetCard?.resolvedImageUrl || targetCard?.imageUrl;
        cardName = targetCard?.name || "";
    }

    const [imageError, setImageError] = useState(false);

    // 画像URLが変わったらエラー状態をリセット
    useEffect(() => {
        setImageError(false);
    }, [imageUrl]);

    const isImageAvailable = !!imageUrl && !imageError && (cardMode === 'simple' || hasAccess);

    // ヘルパー: 検索画面を開く
    const openSearch = (mode: 'tab' | 'window') => {
        const url = window.location.origin + window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + 'view=search';
        if (mode === 'tab') {
            window.open(url, '_blank');
        } else {
            const width = 1200; const height = 800;
            const left = (window.screen.width - width) / 2; const top = (window.screen.height - height) / 2;
            window.open(url, 'CardSearchWindow', `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`);
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;

        if (dragCounter.current === 1) {
            const items = e.dataTransfer.items;
            if (items && items.length > 0) {
                const item = items[0];
                if (item.kind === 'file') {
                    if (item.type.startsWith('image/')) {
                        setDragOverType('image');
                    } else {
                        setDragOverType('folder');
                    }
                }
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Necessary for drop to work
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;

        if (dragCounter.current === 0) {
            setDragOverType('none');
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverType('none');
        dragCounter.current = 0;

        const items = e.dataTransfer.items;
        if (!items || items.length === 0) return;

        const item = items[0];
        if (item.kind !== 'file') return;

        // Try to get as FileSystemHandle for folders
        if ((item as any).getAsFileSystemHandle) {
            try {
                const handle = await (item as any).getAsFileSystemHandle();
                if (import.meta.env.DEV) console.log('[D&D] Handling dropped entity:', handle.kind, handle.name);

                if (handle.kind === 'directory') {
                    onDropFolder(handle as FileSystemDirectoryHandle);
                    return;
                }
                if (handle.kind === 'file') {
                    const file = await (handle as FileSystemFileHandle).getFile();
                    if (file.type.startsWith('image/')) {
                        onDropFile(file);
                        return;
                    }
                }
            } catch (err) {
                console.warn('FileSystemHandle access failed, falling back to basic File API:', err);
            }
        }

        // Fallback to basic File API
        const file = item.getAsFile();
        if (file) {
            if (file.type.startsWith('image/')) {
                onDropFile(file);
            }
        }
    };

    // Sub-elements should not trigger dragLeave on the parent
    const preventFlicker = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="overlay-card-frame relative flex flex-col items-center justify-center animate-in zoom-in duration-500 transform"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                width: '400px',
                height: '560px',
                backgroundColor: isImageAvailable ? 'transparent' : '#1a1b23',
                backdropFilter: 'none',
                border: isImageAvailable
                    ? (dragOverType !== 'none' ? '4px dashed rgba(59, 130, 246, 0.6)' : 'none')
                    : (dragOverType !== 'none' ? '4px dashed rgba(59, 130, 246, 0.8)' : '2px dashed rgba(255, 255, 255, 0.3)'),
                boxShadow: isImageAvailable ? 'none' : 'inset 0 0 20px rgba(0,0,0,0.5)',
                borderRadius: OVERLAY_CARD_RADIUS,
                padding: '20px',
                transition: 'all 0.2s ease'
            }}>

            {/* Drag & Drop Feedback Overlay */}
            {dragOverType !== 'none' && (
                <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-xl rounded-[17px] border-4 animate-in fade-in duration-200 ${dragOverType === 'image' ? 'bg-[#0f111ae6] border-blue-500/80' : 'bg-[#061e14e6] border-emerald-500/80'}`}>
                    <div className={`p-6 rounded-3xl mb-4 shadow-2xl ${dragOverType === 'image' ? 'bg-blue-500/20 border-blue-500/40' : 'bg-emerald-500/20 border-emerald-500/40'} border`}>
                        {dragOverType === 'image' ? (
                            <Image size={64} className="text-blue-400 animate-bounce" />
                        ) : (
                            <FolderOpen size={64} className="text-emerald-400 animate-bounce" />
                        )}
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-white font-black text-xl tracking-tight shadow-sm">
                            {dragOverType === 'image' ? '[Simple Mode]' : '[Library Mode]'}
                        </p>
                        <p className="text-white/90 font-bold text-sm">
                            {dragOverType === 'image' ? 'この画像を表示します' : 'フォルダをスキャンします'}
                        </p>
                    </div>
                </div>
            )}

            {isImageAvailable ? (
                <div className="flex-1 w-full flex items-center justify-center p-0">
                    <div className="h-full aspect-[63/88] overflow-hidden bg-black flex items-center justify-center relative shadow-2xl"
                        onDragOver={preventFlicker}
                        onDrop={handleDrop}
                        style={{ borderRadius: OVERLAY_CARD_RADIUS }}>
                        <img
                            src={imageUrl || undefined}
                            alt={cardName}
                            draggable="false"
                            className="h-full w-full object-cover scale-100 animate-in fade-in zoom-in duration-300 transition-transform"
                            onError={() => {
                                // 画像の読み込みに失敗した場合（Blob URL失効など）
                                if (imageUrl) {
                                    setImageError(true);
                                }
                            }}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-white text-center space-y-6 w-full h-full"
                    onDragOver={preventFlicker}
                    onDrop={handleDrop}
                >
                    {/* 未選択・未接続時の共通表示 */}
                    {((cardMode === 'library' && !hasAccess) || (cardMode === 'simple' && !imageUrl)) ? (
                        <>
                            <div className="bg-blue-500/10 p-6 rounded-3xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                                <Layers size={48} className="text-blue-400" />
                            </div>
                            <div className="space-y-2">
                                <p className="font-bold text-lg text-white leading-relaxed">
                                    {savedRootName && cardMode === 'library' ? 'アクセス許可が必要です' : (
                                        <>表示ソースとなる<br />画像・フォルダが選択されていません</>
                                    )}
                                </p>
                                {savedRootName && cardMode === 'library' && <p className="text-xs text-blue-400 font-medium">接続先: {savedRootName}</p>}
                            </div>

                            <div className="flex flex-col gap-4 w-full max-w-[240px] pointer-events-auto mt-2">
                                <button
                                    onClick={() => {
                                        setSettings({ cardMode: 'simple' });
                                        onSelectSimpleCard();
                                    }}
                                    className="px-[18px] py-[10px] bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 rounded-lg font-bold text-[13px] transition-all cursor-pointer z-50 flex items-center justify-center gap-[8px] shadow-sm"
                                >
                                    <Image size={16} />
                                    画像を選択
                                </button>
                                <button
                                    onClick={() => {
                                        setSettings({ cardMode: 'library' });
                                        savedRootName ? onVerifyPermission() : onRequestAccess();
                                    }}
                                    disabled={isScanning}
                                    className={`px-[18px] py-[10px] rounded-lg font-bold text-[13px] transition-all disabled:opacity-50 flex items-center justify-center gap-[8px] cursor-pointer z-50 border shadow-sm ${!hasAccess && savedRootName && cardMode === 'library' ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-500/80 hover:bg-yellow-500/20 hover:text-yellow-400 hover:border-yellow-500/40' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20'}`}
                                >
                                    {isScanning ? <RefreshCw size={16} className="animate-spin" /> : (savedRootName && cardMode === 'library' ? <Unlock size={16} /> : <FolderSearch size={16} />)}
                                    {isScanning ? 'スキャン中' : (savedRootName && cardMode === 'library' ? 'アクセスを許可' : 'フォルダを選択')}
                                </button>
                            </div>
                        </>
                    ) : cardMode === 'library' ? (
                        // フォルダ接続済みだがカード未選択（Libraryモードのみ）
                        <>
                            <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                                <Search size={48} className="text-amber-400" />
                            </div>
                            <p className="font-bold text-lg text-white">表示カードを選択してください</p>

                            <div className="flex gap-4 pointer-events-auto">
                                <button
                                    onClick={() => openSearch('tab')}
                                    className="px-[18px] py-[10px] bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 rounded-lg font-bold text-[13px] transition-all cursor-pointer z-50 flex items-center gap-[8px] shadow-sm"
                                >
                                    <Layout size={16} />
                                    別タブ
                                </button>
                                <button
                                    onClick={() => openSearch('window')}
                                    className="px-[18px] py-[10px] bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 rounded-lg font-bold text-[13px] transition-all cursor-pointer z-50 flex items-center gap-[8px] shadow-sm"
                                >
                                    <ExternalLink size={16} />
                                    別ウィンドウ
                                </button>
                            </div>

                            {displayCardNo > 0 && pinnedCards && pinnedCards.length < displayCardNo && (
                                <p className="text-xs text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20">
                                    ピン留め番号 <span className="font-bold">{displayCardNo}</span> が存在しません
                                </p>
                            )}
                            <p className="text-[11px] text-white/40 font-medium">
                                Shift + 数字キーで表示カードを変更できます
                            </p>
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
};
