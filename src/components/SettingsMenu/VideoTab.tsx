import { Camera, Monitor, X } from 'lucide-react';
import type { VideoSourceType } from '../VideoBackground';

interface VideoTabProps {
    videoSource: VideoSourceType;
    onVideoSourceChange: (source: VideoSourceType) => void;
    isAdjustingVideo: boolean;
    onToggleVideoAdjust: () => void;
}

export const VideoTab = ({
    videoSource,
    onVideoSourceChange,
    isAdjustingVideo,
    onToggleVideoAdjust
}: VideoTabProps) => (
    <div className="space-y-[24px]">
        <section className="space-y-[8px]">
            <h3 className="text-lg font-bold mb-[8px] flex items-center gap-[6px] border-b border-white/10 pb-[8px]">
                <Camera size={18} className="text-secondary" />
                ビデオソース
            </h3>

            <div className="grid grid-cols-3 gap-[8px]">
                <button
                    className={`py-[12px] px-[8px] rounded-xl transition-all flex flex-col items-center gap-[4px] ${videoSource === 'none'
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    onClick={() => onVideoSourceChange('none')}
                >
                    <X size={20} />
                    <span className="font-bold text-sm">なし</span>
                </button>
                <button
                    className={`py-[12px] px-[8px] rounded-xl transition-all flex flex-col items-center gap-[4px] ${videoSource === 'camera'
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    onClick={() => onVideoSourceChange('camera')}
                >
                    <Camera size={20} />
                    <span className="font-bold text-sm">カメラ</span>
                </button>
                <button
                    className={`py-[12px] px-[8px] rounded-xl transition-all flex flex-col items-center gap-[4px] ${videoSource === 'screen'
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    onClick={() => onVideoSourceChange('screen')}
                >
                    <Monitor size={20} />
                    <span className="font-bold text-sm">画面共有</span>
                </button>
            </div>
        </section>

        {videoSource !== 'none' && (
            <section className="space-y-[8px] p-[16px] rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-base font-bold">映像の調整</h3>
                <p className="text-xs text-gray-400">
                    「調整モード」で移動・リサイズが可能になります。
                </p>
                <button
                    className={`w-full py-[8px] px-[16px] rounded-lg font-bold flex justify-center items-center gap-[6px] transition-all text-sm ${isAdjustingVideo
                        ? 'bg-yellow-600 text-white shadow-lg animate-pulse'
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'
                        }`}
                    onClick={onToggleVideoAdjust}
                >
                    {isAdjustingVideo ? '調整モードを終了' : '調整モードを開始'}
                </button>
            </section>
        )}
    </div>
);
