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
  const [obsMode, setObsMode] = useState<ObsMode>('normal');
  const [isOverlayMode, setIsOverlayMode] = useState(false);

  // Shared State
  const [gameMode, setGameMode] = useState<GameMode>('yugioh');

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
    if (params.get('mode') === 'overlay') {
      setIsOverlayMode(true);
      setObsMode('transparent');
      document.body.classList.add('obs-transparent');
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

      if (data.type === 'RESET') {
        setDiceValue(1);
        setCoinValue('表');
        setResetKey(prev => prev + 1);
      }

      // If a new window asks for state, and I am the controller (not overlay), send it
      if (data.type === 'REQUEST_STATE' && !params.get('mode')) {
        channel.postMessage({ type: 'GAME_MODE', value: gameModeRef.current });
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
      // Disable shortcuts in overlay mode (to avoid double triggering via sync if both windows are focused/active)
      // Also disable if user is typing in an input field
      if (isOverlayMode) return;
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

  const openOverlayWindow = () => {
    window.open(window.location.pathname + '?mode=overlay', 'RemoteDuelOverlay', 'width=1280,height=720');
  };

  const toggleObsMode = () => {
    const modes: ObsMode[] = ['normal', 'transparent', 'green'];
    const nextIndex = (modes.indexOf(obsMode) + 1) % modes.length;
    const nextMode = modes[nextIndex];
    setObsMode(nextMode);

    document.body.className = '';
    if (nextMode !== 'normal') {
      document.body.classList.add(`obs-${nextMode}`);
    }
  };

  return (
    <div className={`app-container w-full h-full flex flex-col box-border ${isOverlayMode ? 'overlay-mode p-0' : 'p-4'}`}>
      {/* Header - Hidden in Overlay Mode */}
      {!isOverlayMode && (
        <>
          <header className="flex justify-between items-center mb-4 p-2 bg-panel rounded-lg">
            <h1 className="text-xl font-bold flex items-center gap-2">
              リモート対戦ツール
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
                className="btn flex items-center gap-2 text-sm"
                onClick={toggleObsMode}
                title="OBSモード切替"
              >
                <Settings size={16} />
                {obsMode === 'normal' ? '通常' : obsMode === 'transparent' ? '透過' : 'GB'}
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
            onDiceClick={!isOverlayMode ? handleRollDice : undefined}
            onCoinClick={!isOverlayMode ? handleFlipCoin : undefined}
          />
        ) : (
          <HololiveTools
            key={`hololive-${resetKey}`}
            isOverlay={isOverlayMode}
            diceValue={diceValue}
            coinValue={coinValue}
            diceKey={diceKey}
            coinKey={coinKey}
            onDiceClick={!isOverlayMode ? handleRollDice : undefined}
            onCoinClick={!isOverlayMode ? handleFlipCoin : undefined}
          />
        )}
      </main>

      {/* Common Tools Footer - Hidden in Overlay Mode */}

    </div>
  );
}

export default App;
