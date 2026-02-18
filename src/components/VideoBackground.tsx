import React, { useEffect, useRef } from 'react';

export type VideoSourceType = 'none' | 'camera' | 'screen';

interface VideoBackgroundProps {
    sourceType: VideoSourceType;
    flipMode?: 'none' | 'horizontal' | 'vertical' | 'both';
    className?: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
    sourceType,
    flipMode = 'none',
    className = ''
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isActive, setIsActive] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Get transform based on flip mode
    const getTransform = () => {
        switch (flipMode) {
            case 'horizontal': return 'scaleX(-1)';
            case 'vertical': return 'scaleY(-1)';
            case 'both': return 'scale(-1, -1)';
            default: return 'none';
        }
    };

    const stopStream = () => {
        setIsActive(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const startStream = async () => {
        setError(null);
        if (sourceType === 'none') {
            stopStream();
            return;
        }

        try {
            let stream: MediaStream;
            if (sourceType === 'camera') {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { min: 1280, ideal: 1920, max: 3840 },
                        height: { min: 720, ideal: 1080, max: 2160 },
                        frameRate: { ideal: 30 }
                    },
                    audio: false
                });
            } else {
                // @ts-ignore
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false
                });
            }

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsActive(true);
        } catch (err: any) {
            console.error('Error accessing media devices:', err);
            setError(err.name === 'NotAllowedError' ? 'カメラの使用許可が必要です' : '映像を取得できませんでした');
            setIsActive(false);
        }
    };

    useEffect(() => {
        startStream();
        return () => stopStream();
    }, [sourceType]);

    if (sourceType === 'none') return null;

    return (
        <div
            className={`fixed inset-0 overflow-hidden bg-black ${className}`}
            style={{ zIndex: -1 }}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: getTransform(),
                    opacity: isActive ? 1 : 0
                }}
            />
            {!isActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 pointer-events-auto z-10 p-6 text-center">
                    <p className="text-white mb-4 text-sm font-medium">
                        {error || (sourceType === 'camera' ? 'カメラ映像を表示します' : '画面共有を開始します')}
                    </p>
                    <button
                        onClick={startStream}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                    >
                        {sourceType === 'camera' ? 'カメラを起動' : '画面共有を開始'}
                    </button>
                    {error && (
                        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                            ブラウザのアドレスバーにあるカメラアイコンから<br />
                            使用を許可してください。
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
