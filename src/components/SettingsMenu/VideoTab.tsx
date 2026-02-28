import { Camera, Monitor, X, Save, MousePointerClick } from 'lucide-react';
import type { VideoSourceType } from '../../types/widgetTypes';

interface VideoTabProps {
    videoSource: VideoSourceType;
    onVideoSourceChange: (source: VideoSourceType) => void;
    isAdjustingVideo: boolean;
    onToggleVideoAdjust: () => void;
    onOpenSaveDialog: (source: 'video-menu', initialOptions?: { includeWidgets: boolean, includeVideo: boolean, hideOthers: boolean }) => void;
    obsMode: 'normal' | 'green';
    onObsModeChange: (mode: 'normal' | 'green') => void;
    availableCameras: MediaDeviceInfo[];
    selectedCameraId: string | null;
    onCameraIdChange: (id: string | null) => void;
}

export const VideoTab = ({
    videoSource,
    onVideoSourceChange,
    isAdjustingVideo,
    onToggleVideoAdjust,
    onOpenSaveDialog,
    obsMode,
    onObsModeChange,
    availableCameras,
    selectedCameraId,
    onCameraIdChange
}: VideoTabProps) => (
    <div className="space-y-[24px]">
        <section className="space-y-[8px]">
            <h3 className="text-lg font-bold mb-[8px] flex items-center gap-[6px] border-b border-white/10 pb-[8px]">
                <Camera size={18} className="text-secondary" />
                映像ソース
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

        {videoSource === 'camera' && availableCameras.length > 0 && (
            <section className="space-y-[8px]">
                <h3 className="text-sm font-bold text-gray-400 flex items-center gap-[8px] uppercase tracking-tight">
                    <MousePointerClick size={14} className="text-blue-400" />
                    カメラを選択
                </h3>
                <div className="relative group">
                    <select
                        value={selectedCameraId || ''}
                        onChange={(e) => onCameraIdChange(e.target.value || null)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-[12px] pr-[40px] py-[10px] text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                    >
                        <option value="" className="bg-[#1e293b]">デフォルトカメラ</option>
                        {availableCameras.map(camera => (
                            <option key={camera.deviceId} value={camera.deviceId} className="bg-[#1e293b]">
                                {camera.label || `カメラ (${camera.deviceId.slice(0, 8)}...)`}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-[12px] top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </div>
                </div>
            </section>
        )}

        {videoSource !== 'none' && (
            <section className="space-y-[12px]">
                <div className="p-[16px] rounded-xl bg-white/5 border border-white/10 space-y-[8px]">
                    <h3 className="text-base font-bold text-white">映像の調整</h3>
                    <p className="text-xs text-gray-400">
                        「調整モード」で移動・リサイズが可能になります。
                    </p>
                    <button
                        className={`w-full py-[10px] px-[16px] rounded-xl font-bold flex justify-center items-center gap-[6px] transition-all text-sm ${isAdjustingVideo
                            ? 'bg-yellow-600 text-white shadow-lg animate-pulse'
                            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'
                            }`}
                        onClick={onToggleVideoAdjust}
                    >
                        {isAdjustingVideo ? '調整モードを終了' : '調整モードを開始'}
                    </button>
                </div>

                <div className="p-[16px] rounded-xl bg-white/5 border border-white/10 space-y-[8px]">
                    <h3 className="text-base font-bold text-white">レイアウトとして保存</h3>
                    <p className="text-xs text-gray-400">現在の映像調整内容をレイアウトとして保存します。</p>
                    <button
                        onClick={() => onOpenSaveDialog('video-menu', { includeWidgets: false, includeVideo: true, hideOthers: false })}
                        className="w-full py-[10px] px-[16px] rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10 flex items-center justify-center gap-2 text-sm"
                    >
                        <Save size={16} />
                        映像調整を保存
                    </button>
                </div>
            </section>
        )}

        {/* 背景色設定 */}
        <section className="space-y-[8px]">
            <h3 className="text-lg font-bold mb-[8px] flex items-center gap-[6px] border-b border-white/10 pb-[8px]">
                <Monitor size={18} className="text-secondary" />
                背景色 (OBS透過用)
            </h3>
            <div className="flex gap-[8px]">
                <button
                    className={`flex-1 py-[8px] px-[12px] rounded-lg font-bold transition-all text-sm ${obsMode === 'normal'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    onClick={() => onObsModeChange('normal')}
                >
                    透過なし
                </button>
                <button
                    className={`flex-1 py-[8px] px-[12px] rounded-lg font-bold transition-all text-sm ${obsMode === 'green'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    onClick={() => onObsModeChange('green')}
                >
                    グリーンバック
                </button>
            </div>
        </section>
    </div>
);
