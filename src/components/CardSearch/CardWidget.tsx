import React from 'react';
import { useCardSearch } from '../../hooks/useCardSearch';
import { FolderOpen, Search, ExternalLink, RefreshCw, Layout, FolderSearch, Unlock } from 'lucide-react';

export const OVERLAY_CARD_RADIUS = '17px';

interface CardWidgetProps {
    hasAccess?: boolean;
    isScanning?: boolean;
    savedRootName?: string | null;
    onRequestAccess?: () => void;
    onVerifyPermission?: () => void;
}

export const CardWidget: React.FC<CardWidgetProps> = ({
    hasAccess = false,
    isScanning = false,
    savedRootName = null,
    onRequestAccess = () => { },
    onVerifyPermission = () => { }
}) => {
    const {
        selectedCard,
        pinnedCards,
        overlayMode,
        displayCardNo
    } = useCardSearch();

    // オーバーレイ表示自体がOFFの場合は何も表示しない
    if (overlayMode === 'off') return null;

    // 表示対象の決定ロジック
    let targetCard = null;
    const hasPins = pinnedCards && pinnedCards.length > 0;

    if (!hasPins) {
        // ピン留めが0件の場合: Noに関わらず、拡大表示キャッシュを表示しようとする
        targetCard = selectedCard;
    } else {
        // ピン留めが1件以上の場合
        if (displayCardNo === 0) {
            // Noが0の時は拡大表示キャッシュを表示
            targetCard = selectedCard;
        } else {
            // Noがn(1以上)の時はピン留めのn番目のカードを表示 (nが数より大きくてもn番目を参照)
            targetCard = pinnedCards[displayCardNo - 1];
        }
    }

    const [imageError, setImageError] = React.useState(false);
    const imageUrl = targetCard?.resolvedImageUrl || targetCard?.imageUrl;

    // 画像URLが変わったらエラー状態をリセット
    React.useEffect(() => {
        setImageError(false);
    }, [imageUrl]);

    const isImageAvailable = !!imageUrl && !imageError && hasAccess;

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

    return (
        <div className="overlay-card-frame relative flex flex-col items-center justify-center animate-in zoom-in duration-500 transform"
            style={{
                width: '400px',
                height: '560px',
                backgroundColor: isImageAvailable ? 'transparent' : 'rgba(0, 0, 0, 0.6)',
                backdropFilter: isImageAvailable ? 'none' : 'blur(4px)',
                border: isImageAvailable ? 'none' : '2px dashed rgba(255, 255, 255, 0.3)',
                boxShadow: isImageAvailable ? 'none' : 'inset 0 0 20px rgba(0,0,0,0.5)',
                borderRadius: OVERLAY_CARD_RADIUS,
                padding: '20px'
            }}>
            {isImageAvailable ? (
                <div className="flex-1 w-full flex items-center justify-center p-0">
                    <div className="h-full aspect-[63/88] overflow-hidden bg-black flex items-center justify-center relative shadow-2xl"
                        style={{ borderRadius: OVERLAY_CARD_RADIUS }}>
                        <img
                            src={imageUrl}
                            alt={targetCard?.name}
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
                <div className="flex flex-col items-center justify-center text-white text-center space-y-6">
                    {!hasAccess ? (
                        // フォルダ未選択またはアクセス許可待ち
                        <>
                            <div className="bg-blue-500/10 p-6 rounded-3xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                                <FolderOpen size={48} className="text-blue-400" />
                            </div>
                            <div className="space-y-2">
                                <p className="font-bold text-lg text-white">
                                    {savedRootName ? 'アクセス許可が必要です' : '表示フォルダが選択されていません'}
                                </p>
                                {savedRootName && <p className="text-xs text-blue-400 font-medium">接続先: {savedRootName}</p>}
                            </div>

                            <button
                                onClick={savedRootName ? onVerifyPermission : onRequestAccess}
                                disabled={isScanning}
                                className={`px-[18px] py-[10px] rounded-lg font-bold text-[13px] transition-all disabled:opacity-50 flex items-center gap-[8px] cursor-pointer pointer-events-auto z-50 border shadow-sm ${!hasAccess && savedRootName ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-500/80 hover:bg-yellow-500/20 hover:text-yellow-400 hover:border-yellow-500/40' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20'}`}
                            >
                                {isScanning ? <RefreshCw size={16} className="animate-spin" /> : (savedRootName ? <Unlock size={16} /> : <FolderSearch size={16} />)}
                                {isScanning ? 'スキャン中' : (savedRootName ? 'アクセスを許可' : 'フォルダを選択')}
                            </button>
                        </>
                    ) : (
                        // フォルダ接続済みだがカード未選択
                        <>
                            <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                                <Search size={48} className="text-amber-400" />
                            </div>
                            <p className="font-bold text-lg text-white">表示カードを選択してください</p>

                            <div className="flex gap-4 pointer-events-auto">
                                <button
                                    onClick={() => openSearch('tab')}
                                    className="px-[18px] py-[10px] bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 rounded-lg font-bold text-[13px] transition-all cursor-pointer pointer-events-auto z-50 flex items-center gap-[8px] shadow-sm"
                                >
                                    <Layout size={16} />
                                    別タブ
                                </button>
                                <button
                                    onClick={() => openSearch('window')}
                                    className="px-[18px] py-[10px] bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 rounded-lg font-bold text-[13px] transition-all cursor-pointer pointer-events-auto z-50 flex items-center gap-[8px] shadow-sm"
                                >
                                    <ExternalLink size={16} />
                                    別ウィンドウ
                                </button>
                            </div>
                        </>
                    )}

                    {hasAccess && displayCardNo > 0 && hasPins && pinnedCards.length < displayCardNo && (
                        <p className="text-xs text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20">
                            ピン留め番号 <span className="font-bold">{displayCardNo}</span> が存在しません
                        </p>
                    )}

                    <p className="text-[11px] text-white/40 font-medium">
                        Shift + 数字キーで表示カードを変更できます
                    </p>
                </div>
            )}
        </div>
    );
};
