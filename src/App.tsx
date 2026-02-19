import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, RefreshCw, ExternalLink, Camera, Monitor, Maximize } from 'lucide-react';
import { YugiohTools } from './components/YugiohTools';
import { HololiveTools } from './components/HololiveTools';
import { VideoBackground, type VideoSourceType, type CropConfig } from './components/VideoBackground';
import { OverlayWidget } from './components/OverlayWidget';
import './App.css';

type GameMode = 'yugioh' | 'hololive';
type ObsMode = 'normal' | 'green';

// Simple BroadcastChannel implementation for sync
const CHANNEL_NAME = 'remote_duel_sync';

function App() {
  const [obsMode, setObsMode] = useState<ObsMode>(() => {
    const saved = (localStorage.getItem('remote_duel_obs_mode') as ObsMode);
    return saved || 'normal';
  });
  const [isOverlayMode, setIsOverlayMode] = useState(false);
  const [videoSource, setVideoSource] = useState<VideoSourceType>(() => {
    return (localStorage.getItem('remote_duel_video_source') as VideoSourceType) || 'none';
  });
  const [videoCrop, setVideoCrop] = useState<CropConfig>(() => {
    const saved = localStorage.getItem('remote_duel_video_crop');
    return saved ? JSON.parse(saved) : { x: 0, y: 0, scale: 1, top: 0, bottom: 0, left: 0, right: 0, rotation: 0, flipH: false, flipV: false };
  });
  const [isAdjustingVideo, setIsAdjustingVideo] = useState(false);

  // Apply initial OBS mode class (Only for Overlay)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isOverlay = params.get('mode') === 'overlay';

    if (isOverlay) {
      document.body.classList.remove('obs-green');
      if (obsMode === 'green') {
        document.body.classList.add('obs-green');
      }
    } else {
      document.body.classList.remove('obs-green');
    }
    return () => {
      document.body.classList.remove('obs-green');
    };
  }, [isOverlayMode]); // Re-run when overlay mode is confirmed

  // Persist OBS mode & Video settings
  useEffect(() => {
    localStorage.setItem('remote_duel_obs_mode', obsMode);
  }, [obsMode]);

  useEffect(() => {
    localStorage.setItem('remote_duel_video_source', videoSource);
  }, [videoSource]);

  // Shared State
  const [gameMode, setGameMode] = useState<GameMode>(() => {
    const saved = localStorage.getItem('remote_duel_game_mode');
    return (saved as GameMode) || 'yugioh';
  });

  // Persist gameMode
  useEffect(() => {
    localStorage.setItem('remote_duel_game_mode', gameMode);
  }, [gameMode]);

  // Persistent Tool State
  const [diceValue, setDiceValue] = useState<number>(1);
  const [coinValue, setCoinValue] = useState<string>('表');
  const [diceKey, setDiceKey] = useState<number>(0);
  const [coinKey, setCoinKey] = useState<number>(0);
  const [resetKey, setResetKey] = useState<number>(0);

  // Ref to access latest state in callback (for sync)
  const gameModeRef = useRef<GameMode>(gameMode);
  const diceValueRef = useRef<number>(diceValue);
  const coinValueRef = useRef<string>(coinValue);
  const videoSourceRef = useRef<VideoSourceType>(videoSource);
  const videoCropRef = useRef<CropConfig>(videoCrop);

  // Update ref when state changes
  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    diceValueRef.current = diceValue;
    coinValueRef.current = coinValue;
  }, [diceValue, coinValue]);

  useEffect(() => {
    videoSourceRef.current = videoSource;
    videoCropRef.current = videoCrop;
  }, [videoSource, videoCrop]);

  // Check URL for overlay mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isOverlay = params.get('mode') === 'overlay';
    if (isOverlay) {
      setIsOverlayMode(true);
      document.title = 'Remote Duel Overlay';
    } else {
      document.title = 'Remote Duel Tool';
    }

    // Setup Sync
    const channel = new BroadcastChannel(CHANNEL_NAME);

    // If overlay, ask for current state
    if (params.get('mode') === 'overlay') {
      channel.postMessage({ type: 'REQUEST_STATE' });
    }

    channel.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'GAME_MODE') setGameMode(data.value);

      if (data.type === 'DICE_UPDATE') {
        setDiceValue(data.value);
        setDiceKey(prev => prev + 1);
      }
      if (data.type === 'COIN_UPDATE') {
        setCoinValue(data.value);
        setCoinKey(prev => prev + 1);
      }

      if (data.type === 'SYNC_STATE') {
        setDiceValue(data.value.dice);
        setCoinValue(data.value.coin);
        if (data.value.videoSource) setVideoSource(data.value.videoSource);
        if (data.value.videoCrop) setVideoCrop(data.value.videoCrop);
        if (data.value.isAdjustingVideo !== undefined) setIsAdjustingVideo(data.value.isAdjustingVideo);
      }

      if (data.type === 'OBS_MODE') {
        const nextMode = data.value as ObsMode;
        setObsMode(nextMode);

        const isOverlay = new URLSearchParams(window.location.search).get('mode') === 'overlay';
        if (isOverlay) {
          document.body.classList.remove('obs-green');
          if (nextMode === 'green') {
            document.body.classList.add('obs-green');
          }
        }
      }

      if (data.type === 'VIDEO_SOURCE') {
        setVideoSource(data.value);
      }

      if (data.type === 'VIDEO_CROP') {
        setVideoCrop(data.value);
      }

      if (data.type === 'VIDEO_ADJUST_MODE') {
        setIsAdjustingVideo(data.value);
      }

      if (data.type === 'CLOSE_OVERLAY') {
        const isOverlay = new URLSearchParams(window.location.search).get('mode') === 'overlay';
        if (isOverlay) {
          window.close();
        }
      }

      if (data.type === 'RESET') {
        setDiceValue(1);
        setCoinValue('表');
        setVideoSource('none');
        setResetKey(prev => prev + 1);
      }

      // If a new window asks for state, and I am the controller (not overlay), send it
      if (data.type === 'REQUEST_STATE' && !params.get('mode')) {
        channel.postMessage({ type: 'GAME_MODE', value: gameModeRef.current });
        channel.postMessage({ type: 'OBS_MODE', value: localStorage.getItem('remote_duel_obs_mode') || 'normal' });
        channel.postMessage({
          type: 'SYNC_STATE', value: {
            dice: diceValueRef.current,
            coin: coinValueRef.current,
            videoSource: videoSourceRef.current,
            videoCrop: videoCropRef.current,
            isAdjustingVideo: isAdjustingVideo
          }
        });
      }
    };

    return () => channel.close();
  }, []);

  // Sync helpers with useCallback
  const broadcast = useCallback((type: string, value: any) => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type, value });
    channel.close();
  }, []);

  const handleGameModeChange = (mode: GameMode) => {
    setGameMode(mode);
    broadcast('GAME_MODE', mode);
  };

  const handleRollDice = useCallback(() => {
    const result = Math.floor(Math.random() * 6) + 1;
    setDiceValue(result);
    setDiceKey(prev => prev + 1);
    broadcast('DICE_UPDATE', result);
  }, [broadcast]);

  const handleFlipCoin = useCallback(() => {
    const result = Math.random() < 0.5 ? '表' : '裏';
    setCoinValue(result);
    setCoinKey(prev => prev + 1);
    broadcast('COIN_UPDATE', result);
  }, [broadcast]);

  const handleReset = useCallback(() => {
    if (confirm('全ての値をリセットしますか？\n(ライフポイント、ログ、履歴、フォーカス、ビデオソースも初期化されます)')) {
      setDiceValue(1);
      setCoinValue('表');
      setVideoSource('none');
      setResetKey(prev => prev + 1);
      broadcast('RESET', null);
    }
  }, [broadcast]);

  const toggleVideoSource = useCallback(() => {
    const sources: VideoSourceType[] = ['none', 'camera', 'screen'];
    const nextIndex = (sources.indexOf(videoSource) + 1) % sources.length;
    const nextSource = sources[nextIndex];
    setVideoSource(nextSource);
    broadcast('VIDEO_SOURCE', nextSource);
  }, [videoSource, broadcast]);

  const handleCropChange = useCallback((config: CropConfig) => {
    setVideoCrop(config);
    broadcast('VIDEO_CROP', config);
    localStorage.setItem('remote_duel_video_crop', JSON.stringify(config));
  }, [broadcast]);

  const toggleAdjustmentMode = () => {
    const nextState = !isAdjustingVideo;
    setIsAdjustingVideo(nextState);
    broadcast('VIDEO_ADJUST_MODE', nextState);
  };

  const resetCrop = useCallback(() => {
    const defaultConfig = { x: 0, y: 0, scale: 1, top: 0, bottom: 0, left: 0, right: 0, rotation: 0, flipH: false, flipV: false };
    setVideoCrop(defaultConfig);
    broadcast('VIDEO_CROP', defaultConfig);
    localStorage.removeItem('remote_duel_video_crop');
  }, [broadcast]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'd' || e.key === 'D') {
        handleRollDice();
      }
      if (e.key === 'c' || e.key === 'C') {
        handleFlipCoin();
      }
      if (e.key === 'v' || e.key === 'V') {
        toggleVideoSource();
      }
      if (e.key === 'a' || e.key === 'A') {
        toggleAdjustmentMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOverlayMode, handleRollDice, handleFlipCoin, videoSource, toggleAdjustmentMode]);

  // Persistence for Overlay Window Size
  useEffect(() => {
    if (!isOverlayMode) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'OVERLAY_RESIZE') {
          const { mode, width, height } = event.data.value;
          localStorage.setItem(`remote_duel_overlay_size_${mode}`, JSON.stringify({ width, height }));
        }
      };
      channel.addEventListener('message', handler);
      return () => {
        channel.removeEventListener('message', handler);
        channel.close();
      };
    } else {
      const lastSentSize = { width: window.innerWidth, height: window.innerHeight };
      const handleResize = () => {
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;
        if (Math.abs(lastSentSize.width - currentWidth) > 5 || Math.abs(lastSentSize.height - currentHeight) > 5) {
          broadcast('OVERLAY_RESIZE', {
            mode: gameMode,
            width: currentWidth,
            height: currentHeight
          });
          lastSentSize.width = currentWidth;
          lastSentSize.height = currentHeight;
        }
      };
      let timer: number;
      const debouncedResize = () => {
        clearTimeout(timer);
        timer = window.setTimeout(handleResize, 500);
      };
      window.addEventListener('resize', debouncedResize);
      handleResize();
      return () => {
        window.removeEventListener('resize', debouncedResize);
        clearTimeout(timer);
      };
    }
  }, [isOverlayMode, gameMode, broadcast]);

  const openOverlay = (target: 'window' | 'tab') => {
    // 既存のオーバーレイ（タブ・窓問わず）に閉じるよう通知
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: 'CLOSE_OVERLAY' });

    // BroadcastChannelが閉じるのを待つ時間が必要な場合があるため、わずかに遅延させる
    setTimeout(() => {
      const url = window.location.pathname + '?mode=overlay';

      if (target === 'tab') {
        window.open(url, 'RemoteDuelOverlayTab');
        return;
      }

      const savedSizeStr = localStorage.getItem(`remote_duel_overlay_size_${gameMode}`);
      let width = gameMode === 'yugioh' ? 350 : 450;
      let height = gameMode === 'yugioh' ? 500 : 750;
      if (savedSizeStr) {
        try {
          const saved = JSON.parse(savedSizeStr);
          width = saved.width || width;
          height = saved.height || height;
        } catch (e) { console.error(e); }
      }
      window.open(
        url,
        'RemoteDuelOverlayWindow',
        `width=${width},height=${height},location=no,toolbar=no,menubar=no,status=no,directories=no,resizable=yes`
      );
    }, 100);
  };

  const toggleObsMode = () => {
    const nextMode = obsMode === 'normal' ? 'green' : 'normal';
    setObsMode(nextMode);
    broadcast('OBS_MODE', nextMode);
  };

  return (
    <div className={`app-container w-full h-full flex flex-col box-border ${isOverlayMode ? 'overlay-mode p-0' : 'p-4'}`}>
      {isOverlayMode && (
        <VideoBackground
          sourceType={videoSource}
          cropConfig={videoCrop}
          onCropChange={handleCropChange}
          onReset={resetCrop}
          onClose={toggleAdjustmentMode}
          isAdjustmentMode={isAdjustingVideo}
        />
      )}

      {!isOverlayMode && (
        <>
          <header className="flex justify-between items-center mb-4 p-2 bg-panel rounded-lg">
            <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
              Remote Duel Tool
              <span className="text-xs font-normal opacity-50">v1.0.0</span>
            </h1>

            <div className="flex gap-2">
              <button
                className="btn flex items-center justify-center gap-2 text-sm px-3"
                onClick={toggleVideoSource}
                title="ビデオソース切替 (V)"
              >
                {videoSource === 'none' ? <Camera size={16} /> : videoSource === 'camera' ? <Camera size={16} className="text-slate-800" /> : <Monitor size={16} className="text-green-700" />}
                <span className="text-xs">{videoSource === 'none' ? 'OFF' : videoSource === 'camera' ? 'Camera' : 'Screen'}</span>
              </button>

              <button
                className={`btn flex items-center justify-center p-2 ${isAdjustingVideo ? 'ring-2 ring-blue-500 bg-blue-900/30' : 'opacity-80'}`}
                onClick={toggleAdjustmentMode}
                title="ビデオ調整 (A / オーバーレイ上でホイールクリック)"
                disabled={videoSource === 'none'}
              >
                <Maximize size={16} className={isAdjustingVideo ? 'text-blue-400' : ''} />
              </button>

              <button
                className="btn flex items-center gap-2 text-sm px-3"
                onClick={() => openOverlay('tab')}
                title="別タブで開く (直接利用向け: 全画面推奨)"
              >
                <Monitor size={16} />
                起動
              </button>

              <button
                className="btn flex items-center gap-2 text-sm px-3"
                onClick={() => openOverlay('window')}
                title="別ウィンドウで開く (OBS向け: サイズ固定可)"
              >
                <ExternalLink size={16} />
                別窓で起動
              </button>

              <button
                className="btn flex items-center justify-center gap-2 text-sm w-[120px] flex-none whitespace-nowrap"
                onClick={toggleObsMode}
                title="OBSモード切替"
              >
                <Settings size={16} />
                <span className="flex-1 text-center">
                  {obsMode === 'normal' ? '通常' : 'GB'}
                </span>
              </button>
            </div>
          </header>

          <div className="header-row">
            <div className="game-mode-tabs">
              <button
                className={`btn flex-1 ${gameMode === 'yugioh' ? 'active-mode' : 'opacity-50'}`}
                onClick={() => handleGameModeChange('yugioh')}
                style={{ backgroundColor: gameMode === 'yugioh' ? 'var(--primary-color)' : '' }}
              >
                遊戯王OCG
              </button>
              <button
                className={`btn flex-1 ${gameMode === 'hololive' ? 'active-mode' : 'opacity-50'}`}
                onClick={() => handleGameModeChange('hololive')}
                style={{ backgroundColor: gameMode === 'hololive' ? 'var(--accent-color)' : '' }}
              >
                ホロライブOCG
              </button>
            </div>

            <button className="btn-reset" onClick={handleReset} title="リセット">
              <RefreshCw size={18} />
            </button>
          </div>
        </>
      )}

      <main className={`flex-1 flex flex-col ${!isOverlayMode ? 'bg-panel border border-border rounded-lg p-4 mb-4' : ''} overflow-hidden relative`}>
        {isOverlayMode ? (
          <OverlayWidget gameMode={gameMode}>
            {gameMode === 'yugioh' ? (
              <YugiohTools
                key={`yugioh-${resetKey}`}
                isOverlay={true}
                diceValue={diceValue}
                coinValue={coinValue}
                diceKey={diceKey}
                coinKey={coinKey}
                onDiceClick={handleRollDice}
                onCoinClick={handleFlipCoin}
                obsMode={obsMode}
              />
            ) : (
              <HololiveTools
                key={`hololive-${resetKey}`}
                isOverlay={true}
                diceValue={diceValue}
                coinValue={coinValue}
                diceKey={diceKey}
                coinKey={coinKey}
                onDiceClick={handleRollDice}
                onCoinClick={handleFlipCoin}
                obsMode={obsMode}
              />
            )}
          </OverlayWidget>
        ) : (
          gameMode === 'yugioh' ? (
            <YugiohTools
              key={`yugioh-${resetKey}`}
              isOverlay={false}
              diceValue={diceValue}
              coinValue={coinValue}
              diceKey={diceKey}
              coinKey={coinKey}
              onDiceClick={handleRollDice}
              onCoinClick={handleFlipCoin}
              obsMode={obsMode}
            />
          ) : (
            <HololiveTools
              key={`hololive-${resetKey}`}
              isOverlay={false}
              diceValue={diceValue}
              coinValue={coinValue}
              diceKey={diceKey}
              coinKey={coinKey}
              onDiceClick={handleRollDice}
              onCoinClick={handleFlipCoin}
              obsMode={obsMode}
            />
          )
        )}
      </main>
    </div>
  );
}

export default App;
