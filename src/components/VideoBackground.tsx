import React, { useEffect, useRef } from 'react';

export type VideoSourceType = 'none' | 'camera' | 'screen';

interface VideoBackgroundProps {
    sourceType: VideoSourceType;
    isMirrored?: boolean;
    className?: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
    sourceType,
    isMirrored = false,
    className = ''
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const startStream = async () => {
        stopStream();
        if (sourceType === 'none') return;

        try {
            let stream: MediaStream;
            if (sourceType === 'camera') {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false
                });
            } else {
                // @ts-ignore - getDisplayMedia might not be in all TS versions
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false
                });
            }

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Error accessing media devices:', err);
            // Revert on error if necessary
        }
    };

    useEffect(() => {
        startStream();
        return () => stopStream();
    }, [sourceType]);

    if (sourceType === 'none') return null;

    return (
        <div
            className={`fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-black ${className}`}
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
                    transform: isMirrored ? 'scaleX(-1)' : 'none'
                }}
            />
        </div>
    );
};
