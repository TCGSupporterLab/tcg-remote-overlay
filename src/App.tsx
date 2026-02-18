import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, RefreshCw, ExternalLink } from 'lucide-react';
import { YugiohTools } from './components/YugiohTools';
import { HololiveTools } from './components/HololiveTools';
import './App.css';

type GameMode = 'yugioh' | 'hololive';
type ObsMode = 'normal' | 'transparent' | 'green';

// Simple BroadcastChannel implementation for sync
const CHANNEL_NAME = 'remote_duel_sync';

function App() {
  const [obsMode, setObsMode] = useState<ObsMode>(() => {
    const saved = (localStorage.getItem('remote_duel_obs_mode') as ObsMode);
    return saved || 'normal';
  });
  const [isOverlayMode, setIsOverlayMode] = useState(false);

  // Apply initial OBS mode class (Only for Overlay)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isOverlay = params.get('mode') === 'overlay';

    if (isOverlay) {
      document.body.classList.remove('obs-transparent', 'obs-green');
      if (obsMode !== 'normal') {
        document.body.classList.add(`obs-${obsMode}`);
      }
    } else {
      // FORCE CLEAN for controller
      document.body.classList.remove('obs-transparent', 'obs-green');
    }
    return () => {
      document.body.classList.remove('obs-transparent', 'obs-green');
    };
  }, [isOverlayMode]); // Re-run when overlay mode is confirmed

  // Persist OBS mode
  useEffect(() => {
    localStorage.setItem('remote_duel_obs_mode', obsMode);
  }, [obsMode]);

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
  // Triggers for animation (increment to replay)
  const [diceKey, setDiceKey] = useState<number>(0);
  const [coinKey, setCoinKey] = useState<number>(0);
  // Trigger for full game reset (remount components)
  const [resetKey, setResetKey] = useState<number>(0);

  // Ref to access latest state in callback (for sync)
  const gameModeRef = useRef<GameMode>(gameMode);
  const diceValueRef = useRef<number>(diceValue);
  const coinValueRef = useRef<string>(coinValue);

  // Update ref when state changes
  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    diceValueRef.current = diceValue;
    coinValueRef.current = coinValue;
  }, [diceValue, coinValue]);

  // Check URL for overlay mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isOverlay = params.get('mode') === 'overlay';
    if (isOverlay) {
      setIsOverlayMode(true);
      setObsMode('transparent');
      document.body.classList.add('obs-transparent');
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
      }

      if (data.type === 'OBS_MODE') {
        const nextMode = data.value as ObsMode;
        setObsMode(nextMode);

        // ALWAYS check URL directly inside handler to avoid stale closures
        const isOverlay = new URLSearchParams(window.location.search).get('mode') === 'overlay';
        if (isOverlay) {
          document.body.classList.remove('obs-transparent', 'obs-green');
          if (nextMode !== 'normal') {
            document.body.classList.add(`obs-${nextMode}`);
          }
        }
      }

      if (data.type === 'RESET') {
        setDiceValue(1);
        setCoinValue('表');
        setResetKey(prev => prev + 1);
      }

      // If a new window asks for state, and I am the controller (not overlay), send it
      if (data.type === 'REQUEST_STATE' && !params.get('mode')) {
        channel.postMessage({ type: 'GAME_MODE', value: gameModeRef.current });
        channel.postMessage({ type: 'OBS_MODE', value: localStorage.getItem('remote_duel_obs_mode') || 'normal' });
        channel.postMessage({ type: 'SYNC_STATE', value: { dice: diceValueRef.current, coin: coinValueRef.current } });
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
    if (confirm('全ての値をリセットしますか？\n(ライフポイント、ログ、履歴、フォーカスも初期化されます)')) {
      setDiceValue(1);
      setCoinValue('表');
      setResetKey(prev => prev + 1);
      broadcast('RESET', null);
    }
  }, [broadcast]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'd' || e.key === 'D') {
        handleRollDice();
      }
      if (e.key === 'c' || e.key === 'C') {
        handleFlipCoin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOverlayMode, handleRollDice, handleFlipCoin]);

  // Persistence for Overlay Window Size
  useEffect(() => {
    if (!isOverlayMode) {
      // Receiver: Handle resize messages from overlay
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
      // Sender: Detect resize in overlay window and notify controller
      const lastSentSize = { width: window.innerWidth, height: window.innerHeight };

      const handleResize = () => {
        // Use innerWidth/Height as they are more reliable across browsers for content sizing
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;

        // Only broadcast if there's a meaningful change to avoid noise
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

      // On mount in overlay: Send initial size to sync if it's the first time
      handleResize();

      return () => {
        window.removeEventListener('resize', debouncedResize);
        clearTimeout(timer);
      };
    }
  }, [isOverlayMode, gameMode, broadcast]);

  const openOverlayWindow = () => {
    // Get saved size or use defaults
    const savedSizeStr = localStorage.getItem(`remote_duel_overlay_size_${gameMode}`);
    let width = gameMode === 'yugioh' ? 350 : 400;
    let height = gameMode === 'yugioh' ? 500 : 700;

    if (savedSizeStr) {
      try {
        const saved = JSON.parse(savedSizeStr);
        width = saved.width || width;
        height = saved.height || height;
      } catch (e) {
        console.error("Failed to parse saved size", e);
      }
    }

    // Open as a popup with minimal browser UI
    // Note: 'width' and 'height' in window.open refer to the viewport (content) size in most modern browsers.
    window.open(
      window.location.pathname + '?mode=overlay',
      'RemoteDuelOverlay',
      `width=${width},height=${height},location=no,toolbar=no,menubar=no,status=no,directories=no,resizable=yes`
    );
  };

  const toggleObsMode = () => {
    const modes: ObsMode[] = ['normal', 'transparent', 'green'];
    const nextIndex = (modes.indexOf(obsMode) + 1) % modes.length;
    const nextMode = modes[nextIndex];
    setObsMode(nextMode);

    // Controller body should NOT be affected
    broadcast('OBS_MODE', nextMode);
  };

  return (
    <div className={`app-container w-full h-full flex flex-col box-border ${isOverlayMode ? 'overlay-mode p-0' : 'p-4'}`}>
      {/* Header - Hidden in Overlay Mode */}
      {!isOverlayMode && (
        <>
          <header className="flex justify-between items-center mb-4 p-2 bg-panel rounded-lg">
            <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
              Remote Duel Tool
              <span className="text-xs font-normal opacity-50">v0.2.0</span>
            </h1>

            <div className="flex gap-2">
              <button
                className="btn flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-500"
                onClick={openOverlayWindow}
                title="OBS用の表示画面を別ウィンドウで開く"
              >
                <ExternalLink size={16} />
                オーバーレイ起動
              </button>

              <button
                className="btn flex items-center justify-center gap-2 text-sm w-[120px] flex-none whitespace-nowrap"
                onClick={toggleObsMode}
                title="OBSモード切替"
              >
                <Settings size={16} className="flex-none" />
                <span className="flex-1 text-center">
                  {obsMode === 'normal' ? '通常' : obsMode === 'transparent' ? '透過' : 'GB'}
                </span>
              </button>
            </div>
          </header>

          {/* Game Mode Tabs */}
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

            <button
              className="btn-reset"
              onClick={handleReset}
              title="リセット"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col ${!isOverlayMode ? 'bg-panel border border-border rounded-lg p-4 mb-4' : ''} overflow-hidden relative`}>

        {/* Standalone OverlayDisplay (For Controller Mode or Non-Yugioh Overlay) */}
        {/* In Yugioh Overlay mode, the overlay is embedded inside YugiohLife for layout control */}
        {/* Standalone OverlayDisplay Removed - now handled internally by each component */}

        {gameMode === 'yugioh' ? (
          <YugiohTools
            key={`yugioh-${resetKey}`}
            isOverlay={isOverlayMode}
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
            isOverlay={isOverlayMode}
            diceValue={diceValue}
            coinValue={coinValue}
            diceKey={diceKey}
            coinKey={coinKey}
            onDiceClick={handleRollDice}
            onCoinClick={handleFlipCoin}
            obsMode={obsMode}
          />
        )}
      </main>

      {/* Common Tools Footer - Hidden in Overlay Mode */}

    </div>
  );
}

export default App;
