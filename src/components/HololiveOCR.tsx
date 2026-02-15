import React, { useState, useRef, useEffect } from 'react';
import { Camera, Scan, Search, AlertCircle } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { OverlayDisplay } from './OverlayDisplay';

const CHANNEL_NAME_OCR = 'remote_duel_sync_ocr';

interface HololiveOCRProps {
    isOverlay?: boolean;
    diceValue?: number;
    coinValue?: string;
    diceKey?: number;
    coinKey?: number;
    onDiceClick?: () => void;
    onCoinClick?: () => void;
}

export const HololiveOCR: React.FC<HololiveOCRProps> = ({
    isOverlay = false,
    diceValue = 1, coinValue = '表', diceKey = 0, coinKey = 0,
    onDiceClick, onCoinClick
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreamActive, setIsStreamActive] = useState(false);
    const [ocrResult, setOcrResult] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Sync OCR result to Overlay
    useEffect(() => {
        const channel = new BroadcastChannel(CHANNEL_NAME_OCR);
        if (isOverlay) {
            // Overlay Mode: Listen for results
            channel.onmessage = (event) => {
                if (event.data.type === 'RESULT') setOcrResult(event.data.value);
                if (event.data.type === 'IMAGE') setCapturedImage(event.data.value);
            };
        }
        return () => channel.close();
    }, [isOverlay]);

    const broadcastResult = (text: string, image: string | null) => {
        const channel = new BroadcastChannel(CHANNEL_NAME_OCR);
        channel.postMessage({ type: 'RESULT', value: text });
        if (image) channel.postMessage({ type: 'IMAGE', value: image });
        channel.close();
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreamActive(true);
                setError(null);
            }
        } catch (err: any) {
            console.error("Camera Error:", err);
            setError("Unable to access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsStreamActive(false);
        }
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
            // Match canvas size to video size
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw current frame
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to simple image for display
            const imageDataUrl = canvas.toDataURL('image/png');
            setCapturedImage(imageDataUrl);
            setOcrResult('');
            setIsProcessing(true);

            // Perform OCR
            try {
                const result = await Tesseract.recognize(
                    imageDataUrl,
                    'jpn', // Japanese engine
                    {
                        logger: m => console.log(m) // Optional progress logging
                    }
                );

                // Clean up text
                const text = result.data.text.replace(/\s+/g, ' ').trim();
                setOcrResult(text);
                broadcastResult(text, imageDataUrl); // Sync to overlay
            } catch (err) {
                console.error(err);
                setOcrResult("Error during recognition.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleSearch = () => {
        if (ocrResult) {
            const query = encodeURIComponent(ocrResult + " ホロライブOCG");
            window.open(`https://www.google.com/search?q=${query}`, '_blank');
        }
    };

    // Overlay View: Only show result and image
    if (isOverlay) {
        return (
            <div
                className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-transparent pointer-events-none"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    pointerEvents: 'none'
                }}
            >
                {/* Main Content Row */}
                <div className="flex flex-row items-center justify-center gap-16 w-full animate-in fade-in duration-500 pointer-events-auto">

                    {/* OCR Result / Image - Left Side equivalent */}
                    <div className="flex flex-col gap-4 items-center justify-center min-w-[300px]">
                        {capturedImage && (
                            <div className="card p-2 bg-black/40 backdrop-blur-md border border-white/10 shadow-xl aspect-video flex items-center justify-center relative rounded-2xl">
                                <img src={capturedImage} alt="Captured" className="max-h-64 object-contain rounded" />
                            </div>
                        )}
                    </div>

                    {/* Center: Dice/Coin */}
                    <OverlayDisplay
                        diceValue={diceValue}
                        coinValue={coinValue}
                        diceKey={diceKey}
                        coinKey={coinKey}
                        onDiceClick={onDiceClick}
                        onCoinClick={onCoinClick}
                        className="pointer-events-auto"
                    />

                    {/* OCR Text Result - Right Side equivalent */}
                    <div className="flex flex-col gap-4 items-center justify-center min-w-[300px]">
                        {ocrResult && (
                            <div className="card p-4 bg-black/40 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl animate-in slide-in-from-bottom max-w-sm">
                                <h3 className="text-sm uppercase opacity-50 font-bold mb-2 text-primary font-orbitron">Scanned Text</h3>
                                <p className="font-mono bg-black/30 p-2 rounded whitespace-pre-wrap max-h-48 overflow-y-auto text-sm">
                                    {ocrResult}
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-4 w-full max-w-2xl mx-auto">
            {/* Controller Dice/Coin */}
            <div className="flex justify-center bg-black/20 rounded-lg py-1 shrink-0">
                <OverlayDisplay
                    diceValue={diceValue}
                    coinValue={coinValue}
                    diceKey={diceKey}
                    coinKey={coinKey}
                    onDiceClick={onDiceClick}
                    onCoinClick={onCoinClick}
                    compact={true}
                    className="pointer-events-auto"
                />
            </div>

            <div className="card p-2 relative overflow-hidden bg-black/50 aspect-video flex items-center justify-center border-dashed shrink-0">
                {!isStreamActive && !capturedImage && (
                    <button onClick={startCamera} className="btn flex items-center gap-2">
                        <Camera /> カメラ起動
                    </button>
                )}

                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Live Video Feed */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-contain ${!isStreamActive ? 'hidden' : ''}`}
                />

                {/* Captured Image Overlay (when paused for analysis) */}
                {capturedImage && !isStreamActive && (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-contain absolute inset-0 bg-black" />
                )}

                {/* Loading Grid */}
                {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
                        <div className="text-primary font-mono animate-pulse flex flex-col items-center">
                            <Scan size={48} className="animate-spin mb-4" />
                            解析中...
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-2 justify-center">
                {isStreamActive && (
                    <button onClick={handleCapture} className="btn bg-accent text-black font-bold flex gap-2 items-center">
                        <Scan size={20} /> キャプチャ & 解析
                    </button>
                )}
                {(isStreamActive || capturedImage) && (
                    <button onClick={() => { setCapturedImage(null); startCamera(); }} className="btn bg-gray-600">
                        再撮影
                    </button>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-900/20 border border-red-500/50 rounded flex items-center gap-2 text-red-200">
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            {/* Results Area */}
            {ocrResult && (
                <div className="card p-4 animate-in slide-in-from-bottom">
                    <h3 className="text-sm uppercase opacity-50 font-bold mb-2">認識されたテキスト</h3>
                    <p className="font-mono bg-black/30 p-2 rounded mb-4 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {ocrResult}
                    </p>
                    <button onClick={handleSearch} className="btn w-full flex items-center justify-center gap-2">
                        <Search size={18} /> Googleで検索する
                    </button>
                </div>
            )}

            <div className="text-center text-xs opacity-40 mt-auto">
                Powered by Tesseract.js - 画像処理は全てブラウザ内で行われます。
            </div>
        </div>
    );
};
