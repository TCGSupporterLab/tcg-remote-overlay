import React from 'react';
import { useCardSearch } from '../../hooks/useCardSearch';

export const OVERLAY_CARD_RADIUS = '17px';

export const CardWidget: React.FC = () => {
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

    const isImageAvailable = !!imageUrl && !imageError;

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
                                setImageError(true);
                            }}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-white text-center space-y-4">
                    <div className="bg-white/10 p-4 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                    </div>
                    <div className="w-full max-w-[320px]">
                        <p className="font-bold text-lg mb-4">表示するカードが選択されていません</p>
                        <div className="text-[13px] text-white/70 leading-relaxed space-y-4">
                            <p>下記手順で画像フォルダに接続し、カードを選択してください</p>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-left font-medium space-y-1.5 grayscale-[0.3]">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                    <span>設定 <span className="text-[10px] opacity-50 font-normal">(Esc / 右クリック)</span></span>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                    <span>ウィジェット</span>
                                </div>
                                <div className="flex items-center gap-2 ml-8 text-blue-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span className="font-bold">カードを表示 ∨</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {displayCardNo > 0 && hasPins && pinnedCards.length < displayCardNo && (
                        <p className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                            ピン留め番号 {displayCardNo} が存在しません
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
