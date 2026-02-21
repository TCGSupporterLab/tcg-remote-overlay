import { useState, useEffect, useRef, useCallback } from 'react';

import { YugiohTools } from './components/YugiohTools';
import { HololiveTools } from './components/HololiveTools';
import { useCardSearch } from './hooks/useCardSearch';
import { VideoBackground, type VideoSourceType, type CropConfig } from './components/VideoBackground';
import { SettingsMenu } from './components/SettingsMenu';
import { OverlayWidget } from './components/OverlayWidget';
import { SPMarkerWidget } from './components/CardSearch/SPMarkerWidget';
import { useLocalCards } from './hooks/useLocalCards';
import { CardSearchContainer } from './components/CardSearch/CardSearchContainer';
import { Layers } from 'lucide-react';
import './App.css';

type GameMode = 'yugioh' | 'hololive' | 'none';
type ObsMode = 'normal' | 'green';

function App() {
  const {
    cards,
    isScanning,
    hasAccess,
    metadataOrder,
    rootHandle,
    requestAccess,
    mergeSameNameCards,
    toggleMergeSameNameCards,
    folderMetadataMap
  } = useLocalCards();

  const {
    spMarkerMode,
    spMarkerFace,
    toggleSPMarkerMode,
    toggleSPMarkerFace,
    toggleSPMarkerForceHidden,
    showSPMarkerForceHidden
  } = useCardSearch(cards, folderMetadataMap);

  // Widget States
  const [gameMode, setGameMode] = useState<GameMode>(() => {
    return (localStorage.getItem('tcg_remote_game_mode') as GameMode) || 'yugioh';
  });
  const [diceValue, setDiceValue] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [coinValue, setCoinValue] = useState<1 | 0>(1);
  const [diceKey, setDiceKey] = useState(0); // For forcing re-render of dice roll animation
  const [coinKey, setCoinKey] = useState(0);

  const [obsMode, setObsMode] = useState<ObsMode>(() => {
    const saved = localStorage.getItem('tcg_remote_obs_mode') || 'normal';
    return saved as ObsMode;
  });
  const [videoSource, setVideoSource] = useState<VideoSourceType>(() => {
    return (localStorage.getItem('tcg_remote_video_source') || localStorage.getItem('remote_duel_video_source')) as VideoSourceType || 'none';
  });
  const [videoCrop, setVideoCrop] = useState<CropConfig>(() => {
    const saved = localStorage.getItem('tcg_remote_video_crop') || localStorage.getItem('remote_duel_video_crop');
    return saved ? JSON.parse(saved) : { x: 0, y: 0, scale: 1, top: 0, bottom: 0, left: 0, right: 0, rotation: 0, flipH: false, flipV: false };
  });
  const [isAdjustingVideo, setIsAdjustingVideo] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'guide' | 'general' | 'widgets' | 'video' | 'about'>('guide');
  const [isCardWidgetVisible, setIsCardWidgetVisible] = useState(true);


  // Apply OBS mode class to body
  useEffect(() => {
    document.body.classList.remove('obs-green');
    if (obsMode === 'green') {
      document.body.classList.add('obs-green');
    }
  }, [obsMode]);

  // Persist OBS mode & Video settings
  useEffect(() => {
    localStorage.setItem('tcg_remote_obs_mode', obsMode);
  }, [obsMode]);

  useEffect(() => {
    localStorage.setItem('tcg_remote_video_source', videoSource);
  }, [videoSource]);

  // Shared State
  // Persist gameMode
  useEffect(() => {
    localStorage.setItem('tcg_remote_game_mode', gameMode);
  }, [gameMode]);

  // Persistent Tool State
  const lastDotTapRef = useRef<number>(0);
  const dotTimerRef = useRef<number | null>(null);
  // Document Title
  useEffect(() => {
    document.title = 'TCG Remote Overlay';
  }, []);

  const handleGameModeChange = (mode: GameMode) => {
    setGameMode(mode);
  };

  const handleRollDice = useCallback(() => {
    const result = (Math.floor(Math.random() * 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
    setDiceValue(result);
    setDiceKey(prev => prev + 1);
  }, []);

  const handleFlipCoin = useCallback(() => {
    const result = Math.random() < 0.5 ? 1 : 0;
    setCoinValue(result);
    setCoinKey(prev => prev + 1);
  }, []);


  const toggleVideoSource = useCallback(() => {
    const sources: VideoSourceType[] = ['none', 'camera', 'screen'];
    const nextIndex = (sources.indexOf(videoSource) + 1) % sources.length;
    const nextSource = sources[nextIndex];
    setVideoSource(nextSource);
  }, [videoSource]);

  const handleCropChange = useCallback((config: CropConfig) => {
    setVideoCrop(config);
    localStorage.setItem('tcg_remote_video_crop', JSON.stringify(config));
  }, []);

  const toggleAdjustmentMode = () => {
    setIsAdjustingVideo(prev => !prev);
  };

  const resetCrop = useCallback(() => {
    const defaultConfig = { x: 0, y: 0, scale: 1, top: 0, bottom: 0, left: 0, right: 0, rotation: 0, flipH: false, flipV: false };
    setVideoCrop(defaultConfig);
    localStorage.removeItem('tcg_remote_video_crop');
  }, []);

  // Keyboard Shortcuts & Global Context Menu
  useEffect(() => {
    // Prevent default right click menu and instead open settings
    const handleContextMenu = (e: MouseEvent) => {
      // Allow right click if we are adjusting video or interacting with an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || isAdjustingVideo) return;
      e.preventDefault();

      if (!showSettings) {
        setShowSettings(true);
      } else {
        // If already open, close if we click on a non-interactive element
        const target = e.target as HTMLElement;
        const isInteractive = target.closest?.('button, a, kbd, input, select, textarea');
        if (!isInteractive) {
          setShowSettings(false);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Settings Menu toggle
      if (e.key === 'Escape') {
        setShowSettings(prev => !prev);
        // If closing settings and we are adjusting video, close adjustment mode too
        if (showSettings && isAdjustingVideo) {
          setIsAdjustingVideo(false);
        }
        return;
      }

      // Allow hotkeys only if settings are closed
      if (showSettings) return;

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
      if (gameMode === 'hololive' && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        toggleSPMarkerForceHidden();
      }

      // Numpad "." (Roll Dice / Double tap for Coin or SP Flip)
      if (e.key === '.' || e.key === 'Decimal' || e.code === 'NumpadDecimal') {
        e.preventDefault();
        const now = Date.now();
        const diff = now - lastDotTapRef.current;

        if (gameMode === 'yugioh') {
          if (diff > 0 && diff < 150) {
            // Double tap!
            if (dotTimerRef.current) {
              window.clearTimeout(dotTimerRef.current);
              dotTimerRef.current = null;
            }
            handleFlipCoin();
            lastDotTapRef.current = 0; // Reset
          } else {
            // First tap or outside double-tap window
            lastDotTapRef.current = now;
            if (dotTimerRef.current) window.clearTimeout(dotTimerRef.current);
            dotTimerRef.current = window.setTimeout(() => {
              handleRollDice();
              dotTimerRef.current = null;
              lastDotTapRef.current = 0;
            }, 150);
          }
        } else {
          // Hololive mode
          if (diff > 0 && diff < 200) {
            // Double tap!
            if (dotTimerRef.current) {
              window.clearTimeout(dotTimerRef.current);
              dotTimerRef.current = null;
            }
            toggleSPMarkerFace();
            lastDotTapRef.current = 0; // Reset
          } else {
            // First tap
            lastDotTapRef.current = now;
            if (dotTimerRef.current) window.clearTimeout(dotTimerRef.current);
            dotTimerRef.current = window.setTimeout(() => {
              handleRollDice();
              dotTimerRef.current = null;
              lastDotTapRef.current = 0;
            }, 200);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      if (dotTimerRef.current) window.clearTimeout(dotTimerRef.current);
    };
  }, [gameMode, handleRollDice, handleFlipCoin, toggleVideoSource, toggleAdjustmentMode, toggleSPMarkerFace, toggleSPMarkerForceHidden, showSettings, isAdjustingVideo]);

  // View mode detection
  const isSearchView = new URLSearchParams(window.location.search).get('view') === 'search';

  if (isSearchView) {
    return (
      <div className="app-container w-full h-full bg-gray-900 overflow-hidden flex flex-col p-[8px]">
        {/* Full screen Search UI mode */}
        <div className="flex-1 rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
          <CardSearchContainer localCards={cards} metadataOrder={metadataOrder} folderMetadataMap={folderMetadataMap} />

          {/* Helper overlay for standalone mode if needed */}
          {!hasAccess && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex flex-col items-center justify-center text-center p-6">
              <div className="bg-[#1a1c2e] p-8 rounded-3xl border border-white/10 shadow-2xl max-w-sm">
                <Layers size={48} className="text-blue-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">フォルダ接続が必要です</h3>
                <p className="text-gray-400 text-sm mb-6">本体画面でフォルダを選択してスキャンを完了させてから利用してください。</p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
                >
                  再読み込み
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container w-full h-full flex flex-col box-border overlay-mode p-0 relative">

      {/* 1. Video Layer (Back) */}
      <VideoBackground
        sourceType={videoSource}
        cropConfig={videoCrop}
        onCropChange={handleCropChange}
        onReset={resetCrop}
        onClose={toggleAdjustmentMode}
        isAdjustmentMode={isAdjustingVideo}
      />

      {/* 2 & 3. GB and Widgets Layer */}
      <main className="absolute inset-0 flex flex-col overflow-hidden pointer-events-none z-10">

        {/* We keep overlayMode variables inside tool props to ensure they behave consistently without controllers */}
        <OverlayWidget gameMode={gameMode}>
          <div className="pointer-events-auto">
            {gameMode !== 'none' && (
              gameMode === 'yugioh' ? (
                <YugiohTools
                  key="yugioh-tools"
                  isOverlay={true}
                  diceValue={diceValue}
                  coinValue={coinValue === 1 ? '表' : '裏'}
                  diceKey={diceKey}
                  coinKey={coinKey}
                  onDiceClick={handleRollDice}
                  onCoinClick={handleFlipCoin}
                  obsMode={obsMode}
                />
              ) : (
                isCardWidgetVisible ? (
                  <HololiveTools
                    key="hololive-tools"
                    isOverlay={true}
                    diceValue={diceValue}
                    coinValue={coinValue === 1 ? '表' : '裏'}
                    diceKey={diceKey}
                    coinKey={coinKey}
                    onDiceClick={handleRollDice}
                    onCoinClick={handleFlipCoin}
                    obsMode={obsMode}
                    localCards={cards}
                  />
                ) : null
              )
            )}
          </div>
        </OverlayWidget>

        {/* Independent SP Marker Widget */}
        {gameMode === 'hololive' && spMarkerMode === 'independent' && !showSPMarkerForceHidden && (
          <OverlayWidget gameMode="hololive_sp_marker">
            <div className="pointer-events-auto">
              <SPMarkerWidget
                face={spMarkerFace}
                onToggle={toggleSPMarkerFace}
                isFollowMode={false}
              />
            </div>
          </OverlayWidget>
        )}
      </main>

      {/* 4. Removed Initial Help Screen (now in Settings Guide tab) */}

      {/* 5. Settings Menu Layer (Front) */}
      {showSettings && (
        <SettingsMenu
          onClose={() => setShowSettings(false)}
          videoSource={videoSource}
          onVideoSourceChange={setVideoSource}
          isAdjustingVideo={isAdjustingVideo}
          onToggleVideoAdjust={toggleAdjustmentMode}
          gameMode={gameMode}
          onGameModeChange={handleGameModeChange}
          obsMode={obsMode}
          onObsModeChange={setObsMode}
          // Tab State Props (Lifted)
          activeTab={activeSettingsTab}
          onTabChange={setActiveSettingsTab}
          // File System Access Props
          hasAccess={hasAccess}
          rootHandleName={rootHandle?.name}
          cardCount={cards.length}
          isScanning={isScanning}
          onRequestAccess={requestAccess}
          onDropAccess={() => {
            window.location.reload();
          }}
          mergeSameNameCards={mergeSameNameCards}
          onToggleMergeSameNameCards={toggleMergeSameNameCards}
          localCards={cards}
          folderMetadataMap={folderMetadataMap}
          isCardWidgetVisible={isCardWidgetVisible}
          onToggleCardWidgetVisible={setIsCardWidgetVisible}
          spMarkerMode={spMarkerMode}
          onToggleSPMarkerMode={toggleSPMarkerMode}
        />
      )}
    </div>
  );
}

export default App;
