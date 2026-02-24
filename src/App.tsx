import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { LPCalculator } from './components/LPCalculator';

import { useCardSearch, restoreFolderCache } from './hooks/useCardSearch';
import { useWidgetStore, type DisplayPreset } from './store/useWidgetStore';
import { VideoBackground, type VideoSourceType, type CropConfig } from './components/VideoBackground';
import { SettingsMenu } from './components/SettingsMenu';
import { OverlayWidget } from './components/OverlayWidget';
import { SPMarkerWidget } from './components/CardSearch/SPMarkerWidget';
import { useLocalCards } from './hooks/useLocalCards';
import { CardSearchContainer } from './components/CardSearch/CardSearchContainer';
import { CardWidget } from './components/CardSearch/CardWidget';
import { OverlayDisplay } from './components/OverlayDisplay';
import { useWidgetSelection } from './hooks/useWidgetSelection';
import { MoveableController } from './components/MoveableController';
import { SelectionActionBar } from './components/SelectionActionBar';
import { type WidgetId, type WidgetGroup } from './types/widgetTypes';
import { Layers, RefreshCw } from 'lucide-react';
import './App.css';

const TAB_ID = crypto.randomUUID();
(window as any).TAB_ID = TAB_ID;

function App() {


  const {
    cards,
    isScanning,
    hasAccess,
    metadataOrder,
    rootHandle,
    savedRootName,
    requestAccess,
    verifyPermissionAndScan,
    dropAccess,
    mergeSameFileCards,
    toggleMergeSameFileCards,
    isLoading
  } = useLocalCards();

  const {
    isSyncing,
    pinnedCards,
    selectedCard,
    displayCardNo,
    setDisplayCardNo,
    rootFolderName,
    setRootFolderName
  } = useCardSearch(cards, metadataOrder, mergeSameFileCards);

  const visibility = useWidgetStore(s => s.visibility);
  const settings = useWidgetStore(s => s.settings);
  const obsMode = useWidgetStore(s => s.obsMode);
  const videoSource = useWidgetStore(s => s.videoSource);
  const videoCrop = useWidgetStore(s => s.videoCrop);
  const diceValue = useWidgetStore(s => s.diceValue);
  const coinValue = useWidgetStore(s => s.coinValue);
  const groupData = useWidgetStore(s => s.groupData);
  const selectedWidgetIds = useWidgetStore(s => s.selectedWidgetIds);

  const setVisibility = useWidgetStore(s => s.setVisibility);
  const setSettings = useWidgetStore(s => s.setSettings);
  const setObsMode = useWidgetStore(s => s.setObsMode);
  const setVideoSource = useWidgetStore(s => s.setVideoSource);
  const setVideoCrop = useWidgetStore(s => s.setVideoCrop);
  const setDiceValue = useWidgetStore(s => s.setDiceValue);
  const setCoinValue = useWidgetStore(s => s.setCoinValue);
  const setGroupData = useWidgetStore(s => s.setGroupData);
  const setSelectedWidgets = useWidgetStore(s => s.setSelectedWidgets);
  const groupSelectedWidgets = useWidgetStore(s => s.groupSelectedWidgets);

  const {
    isDiceVisible,
    isCoinVisible,
    isLPVisible,
    isCardWidgetVisible,
    isSPMarkerVisible,
    showSPMarkerForceHidden,
  } = visibility;

  const {
    initialLP,
    onlyShowPlayer1,
    activePreset,
    spMarkerFace,
  } = settings;

  // Actions for compatibility or simplified calling
  const setDiceVisible = (val: boolean) => setVisibility({ isDiceVisible: val });
  const setCoinVisible = (val: boolean) => setVisibility({ isCoinVisible: val });
  const setLPVisible = (val: boolean) => setVisibility({ isLPVisible: val });
  const setCardWidgetVisible = (val: boolean) => setVisibility({ isCardWidgetVisible: val });
  const setInitialLP = (val: number) => setSettings({ initialLP: val });
  const setOnlyShowPlayer1 = (val: boolean) => setSettings({ onlyShowPlayer1: val });
  const setActivePreset = (preset: DisplayPreset) => setSettings({ activePreset: preset });
  const toggleSPMarkerMode = () => setVisibility({ isSPMarkerVisible: !isSPMarkerVisible });
  const toggleSPMarkerFace = () => setSettings({ spMarkerFace: spMarkerFace === 'front' ? 'back' : 'front' });
  const toggleSPMarkerForceHidden = () => setVisibility({ showSPMarkerForceHidden: !showSPMarkerForceHidden });

  // Sync folder name for caching logic
  const prevFolderRef = useRef(rootFolderName);
  useEffect(() => {
    const currentName = rootHandle?.name || savedRootName || '';
    if (currentName !== rootFolderName) {
      const wasEmpty = !prevFolderRef.current;
      setRootFolderName(currentName);
      prevFolderRef.current = currentName;
      // フォルダ接続時にキャッシュから復元
      if (wasEmpty && currentName) {
        restoreFolderCache(currentName);
      }
    }
  }, [rootHandle?.name, savedRootName, rootFolderName, setRootFolderName]);


  const [diceKey, setDiceKey] = useState(0); // For forcing re-render of dice roll animation
  const [coinKey, setCoinKey] = useState(0);

  const [isAdjustingVideo, setIsAdjustingVideo] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'guide' | 'general' | 'widgets' | 'video' | 'about'>('guide');

  // Widget Selection & Grouping
  const {
    clearSelection,
  } = useWidgetSelection();

  const widgetRefsMap = useRef<Map<WidgetId, HTMLDivElement>>(new Map());
  const containerRefCallback = useCallback((id: WidgetId, el: HTMLDivElement | null) => {
    if (el) {
      widgetRefsMap.current.set(id, el);
    } else {
      widgetRefsMap.current.delete(id);
    }
  }, []);


  // Widget visibility map






  // Find group for a widget
  const findGroupForWidget = useCallback((widgetId: WidgetId): WidgetGroup | undefined => {
    return groupData.groups.find(g => g.memberIds.includes(widgetId));
  }, [groupData]);

  // Helper to map selected widget IDs to their group IDs if they belong to one.
  // This ensures that selecting ANY member of a group selects the WHOLE group.

  // Wrap toggleSelect to handle group mapping automatically for single-click selection


  const effectiveSelectionMembers = useMemo(() => {
    const members = new Set<WidgetId>();
    selectedWidgetIds.forEach(id => {
      const g = groupData.groups.find(group => group.id === id);
      if (g) {
        g.memberIds.forEach(m => members.add(m));
      } else {
        members.add(id as WidgetId);
      }
    });
    return Array.from(members);
  }, [selectedWidgetIds, groupData.groups]);

  // Stable ref to selection for callbacks
  const effectiveSelectionMembersRef = useRef<WidgetId[]>([]);
  useEffect(() => {
    effectiveSelectionMembersRef.current = effectiveSelectionMembers;
  }, [effectiveSelectionMembers]);

  const isMultiSelectionActive = effectiveSelectionMembers.length > 1;


  // Debug logging for multiple selection start
  useEffect(() => {
    if (import.meta.env.DEV && isMultiSelectionActive) {
      console.log(`[SelectionDebug] Multiple objects selected: ${effectiveSelectionMembers.join(', ')}`);
    }
  }, [isMultiSelectionActive, effectiveSelectionMembers]);








  // Ungroup










  // Apply OBS mode class to body
  useEffect(() => {
    document.body.classList.remove('obs-green');
    if (obsMode === 'green') {
      document.body.classList.add('obs-green');
    }
  }, [obsMode]);

  // Shared State
  // Persist activePreset
  useEffect(() => {
    // Already handled by useWidgetStore subscriber
  }, [activePreset]);

  // Persistent Tool State
  const lastDotTapRef = useRef<number>(0);
  const dotTimerRef = useRef<number | null>(null);
  const displayCardNoBufferRef = useRef<string>("");
  const displayCardNoTimerRef = useRef<number | null>(null);
  // View mode detection
  const searchViewParam = new URLSearchParams(window.location.search).get('view');
  const isSearchView = searchViewParam === 'search';
  const [isTerminated, setIsTerminated] = useState(false);

  // Document Title & Single Instance Control
  useEffect(() => {
    const type = isSearchView ? 'search' : 'main';
    const title = isSearchView ? 'TCG Remote Overlay - カード表示設定' : 'TCG Remote Overlay';
    document.title = title;

    // Instance Synchronization via BroadcastChannel
    const channel = new BroadcastChannel('tcg_instance_sync');

    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'new_instance' && e.data.viewType === type) {
        // A newer instance of the same type has been opened
        if (import.meta.env.DEV) console.log(`[App] Closing old instance of type: ${type}`);

        // Attempt to close. If it fails (usually because it wasn't opened by script), show termination UI
        window.close();
        setIsTerminated(true);
      }
    };

    channel.addEventListener('message', handleMessage);

    // Announce new instance to others
    channel.postMessage({ type: 'new_instance', viewType: type, timestamp: Date.now() });

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [isSearchView]);

  const handlePresetChange = (preset: DisplayPreset) => {
    setActivePreset(preset);
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

      // Settings / Selection toggle
      if (e.key === 'Escape') {
        if (selectedWidgetIds.length > 0) {
          clearSelection();
          return;
        }
        setShowSettings(prev => !prev);
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
      if (activePreset === 'hololive' && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        toggleSPMarkerForceHidden();
      }

      // G key: Group selected widgets
      if ((e.key === 'g' || e.key === 'G') && selectedWidgetIds.length >= 2) {
        e.preventDefault();
        groupSelectedWidgets();
      }

      // Numpad "." (Roll Dice / Double tap for Coin or SP Flip)
      if (e.key === '.' || e.key === 'Decimal' || e.code === 'NumpadDecimal') {
        e.preventDefault();
        const now = Date.now();
        const diff = now - lastDotTapRef.current;

        if (activePreset === 'yugioh') {
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


      // Shift + Number keys (Digit0-9 or Numpad0-9) for Display Card Number
      // Support multi-digit input by buffering digits within a 200ms window
      const digitMatch = e.code.match(/^(Digit|Numpad)(\d)$/);
      if (digitMatch) {
        const isNumpad = digitMatch[1] === 'Numpad';
        const isNumLock = e.getModifierState('NumLock');
        const isShift = e.shiftKey || e.getModifierState('Shift');

        // Check if this is a "Shift + Digit" combination
        let isShiftedDigit = false;
        if (!isNumpad) {
          isShiftedDigit = isShift;
        } else {
          // For Numpad, only allow shortcuts if NumLock is ON.
          // Note: On Windows, Shift + Numpad (NumLock ON) often clears e.shiftKey and changes e.key to "End", etc.
          // We detect this by checking if e.key is NOT a digit when the code is a Numpad digit.
          if (isNumLock) {
            isShiftedDigit = isShift || !/^\d$/.test(e.key);
          }
        }

        if (isShiftedDigit) {
          e.preventDefault();
          const digit = digitMatch[2];

          if (displayCardNoTimerRef.current) {
            window.clearTimeout(displayCardNoTimerRef.current);
          } else {
            displayCardNoBufferRef.current = "";
          }

          displayCardNoBufferRef.current += digit;

          const num = parseInt(displayCardNoBufferRef.current, 10);
          if (!isNaN(num)) {
            setDisplayCardNo(num);
          }

          displayCardNoTimerRef.current = window.setTimeout(() => {
            displayCardNoBufferRef.current = "";
            displayCardNoTimerRef.current = null;
          }, 200); // Match Hololive card selection window (200ms)
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [activePreset, handleRollDice, handleFlipCoin, toggleVideoSource, toggleAdjustmentMode, toggleSPMarkerFace, toggleSPMarkerForceHidden, showSettings, isAdjustingVideo, setDisplayCardNo, selectedWidgetIds, clearSelection, groupSelectedWidgets]);


  if (import.meta.env.DEV) {
    useEffect(() => {
      console.log(`[App] Global State - isScanning: ${isScanning}, isLoading: ${isLoading}, hasAccess: ${hasAccess}, isSyncing: ${isSyncing}`);
      console.log(`[App] Overlay Condition: ${isScanning || isSyncing || (isLoading && (hasAccess || !rootHandle))}`);
    }, [isScanning, isLoading, hasAccess, isSyncing]);
  }

  // Render termination overlay if this instance should be closed
  if (isTerminated) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[9000] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="bg-[#0f111a] p-10 rounded-[2.5rem] border-2 border-red-500/20 shadow-[0_0_100px_rgba(239,68,68,0.2)] max-w-md w-full animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <RefreshCw size={40} className="text-red-500 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-black mb-4 text-white">セッションが終了しました</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            別のタブまたはウィンドウで新しい画面が開かれたため、このインスタンスは無効化されました。
          </p>
          <div className="text-xs text-gray-500 font-mono bg-black/40 p-3 rounded-xl border border-white/5 uppercase tracking-widest">
            Instance Terminated
          </div>
        </div>
      </div>
    );
  }

  const ScanningOverlay = (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-[2000] flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 flex items-center justify-center">
          <svg width="80" height="80" viewBox="0 0 100 100">
            {/* 外周の回転リング */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500/20" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-500" strokeDasharray="60 220">
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1s" repeatCount="indefinite" />
            </circle>
            {/* 内側の逆回転レーダー */}
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400/10" strokeDasharray="10 178">
              <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="1.5s" repeatCount="indefinite" />
            </circle>
            {/* 中心で鼓動するコア */}
            <circle cx="50" cy="50" r="6" className="fill-blue-400">
              <animate attributeName="r" values="4;8;4" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
        <div className="flex flex-col gap-1 items-center">
          <span className="text-white font-black text-sm tracking-[0.4em] pl-[0.4em] uppercase">Scanning</span>
          <div className="flex gap-1.5 mt-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full">
                <animate attributeName="opacity" values="1;0.2;1" dur="1s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isSearchView) {
    return (
      <div className="app-container w-full h-full bg-gray-900 overflow-hidden flex flex-col p-[8px]">
        {/* Full screen Search UI mode */}
        <div className="flex-1 rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
          <CardSearchContainer
            localCards={cards}
            metadataOrder={metadataOrder}
            mergeSameFileCards={mergeSameFileCards}
          />

          {/* Scanning/Loading Overlay when already granted or checking */}
          {(isScanning || isSyncing || (isLoading && (hasAccess || !rootHandle))) && ScanningOverlay}

          {/* Helper overlay for standalone mode */}
          {!hasAccess && !isScanning && !isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex flex-col items-center justify-center text-center p-6 px-12">
              <div className="bg-[#1a1c2e] p-8 rounded-3xl border border-white/20 shadow-2xl max-w-sm animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                  <Layers size={32} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">接続の再開が必要です</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  ブラウザのセキュリティ制限により、新しいウィンドウでは再度フォルダへのアクセス許可が必要です。<br />
                  <span className="text-blue-400/80 text-xs text-center block mt-2">※許可後に自動でカードが読み込まれます</span>
                </p>
                <button
                  onClick={verifyPermissionAndScan}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} className={isScanning ? "animate-spin" : ""} />
                  {isScanning ? "スキャン中..." : "アクセスを許可する"}
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
      <main
        className="absolute inset-0 flex flex-col overflow-hidden z-10"
        style={{ pointerEvents: !isAdjustingVideo ? 'auto' : 'none' }}
      >

        {/* Independent Card Widget */}
        {isCardWidgetVisible && (
          <OverlayWidget
            widgetId="card_widget"
            instanceId="card_widget"
            isSelected={effectiveSelectionMembers.includes('card_widget')}
            isGrouped={!!findGroupForWidget('card_widget')}
            containerRefCallback={containerRefCallback}
          >
            <CardWidget
              hasAccess={hasAccess}
              isScanning={isScanning}
              savedRootName={savedRootName}
              onRequestAccess={requestAccess}
              onVerifyPermission={verifyPermissionAndScan}
            />
          </OverlayWidget>
        )}



        {/* Life Points Widget (YugiohTools) */}
        {isLPVisible && (
          <OverlayWidget
            widgetId="lp_calculator"
            instanceId="lp_calculator"
            isSelected={effectiveSelectionMembers.includes('lp_calculator')}
            isGrouped={!!findGroupForWidget('lp_calculator')}
            containerRefCallback={containerRefCallback}
          >
            <div className="pointer-events-auto">
              <LPCalculator
                key="lp-calculator"
                isOverlay={true}
                diceValue={diceValue}
                coinValue={coinValue === 1 ? '表' : '裏'}
                diceKey={diceKey}
                coinKey={coinKey}
                onDiceClick={handleRollDice}
                onCoinClick={handleFlipCoin}
                obsMode={obsMode}
                isDiceVisible={false}
                isCoinVisible={false}
                isLPVisible={true}
                initialLP={initialLP}
                onlyShowPlayer1={onlyShowPlayer1}
              />
            </div>
          </OverlayWidget>
        )}

        {/* Independent SP Marker Widget */}
        {isSPMarkerVisible && !showSPMarkerForceHidden && (
          <OverlayWidget
            widgetId="sp_marker"
            instanceId="sp_marker"
            isSelected={effectiveSelectionMembers.includes('sp_marker')}
            isGrouped={!!findGroupForWidget('sp_marker')}
            containerRefCallback={containerRefCallback}
          >
            <div className="pointer-events-auto">
              <SPMarkerWidget
                face={spMarkerFace}
                onToggle={toggleSPMarkerFace}
              />
            </div>
          </OverlayWidget>
        )}

        {/* 4. Independent Dice Widget */}
        {isDiceVisible && (
          <OverlayWidget
            widgetId="dice"
            instanceId="dice"
            isSelected={effectiveSelectionMembers.includes('dice')}
            isGrouped={!!findGroupForWidget('dice')}
            containerRefCallback={containerRefCallback}
          >
            <div className="pointer-events-auto">
              <OverlayDisplay
                diceValue={diceValue}
                coinValue={coinValue === 1 ? '表' : '裏'}
                diceKey={diceKey}
                coinKey={coinKey}
                onDiceClick={handleRollDice}
                showDice={true}
                showCoin={false}
                compact={false}
              />
            </div>
          </OverlayWidget>
        )}

        {/* 5. Independent Coin Widget */}
        {isCoinVisible && (
          <OverlayWidget
            widgetId="coin"
            instanceId="coin"
            isSelected={effectiveSelectionMembers.includes('coin')}
            isGrouped={!!findGroupForWidget('coin')}
            containerRefCallback={containerRefCallback}
          >
            <div className="pointer-events-auto">
              <OverlayDisplay
                diceValue={diceValue}
                coinValue={coinValue === 1 ? '表' : '裏'}
                diceKey={diceKey}
                coinKey={coinKey}
                onCoinClick={handleFlipCoin}
                showDice={false}
                showCoin={true}
                compact={false}
              />
            </div>
          </OverlayWidget>
        )}

      </main>




      {/* 4. Removed Initial Help Screen (now in Settings Guide tab) */}

      {/* 5. Settings Menu Layer (Front) */}
      {
        showSettings && (
          <SettingsMenu
            onClose={() => setShowSettings(false)}
            videoSource={videoSource}
            onVideoSourceChange={setVideoSource}
            isAdjustingVideo={isAdjustingVideo}
            onToggleVideoAdjust={toggleAdjustmentMode}
            activePreset={activePreset}
            onPresetChange={handlePresetChange}
            obsMode={obsMode}
            onObsModeChange={setObsMode}
            // Tab State Props (Lifted)
            activeTab={activeSettingsTab}
            onTabChange={setActiveSettingsTab}
            // File System Access Props
            hasAccess={hasAccess}
            rootHandleName={savedRootName || rootHandle?.name}
            cardCount={cards.length}
            isScanning={isScanning}
            onRequestAccess={requestAccess}
            onDropAccess={dropAccess}
            mergeSameFileCards={mergeSameFileCards}
            onToggleMergeSameFileCards={toggleMergeSameFileCards}
            localCards={cards}
            metadataOrder={metadataOrder}
            isCardWidgetVisible={isCardWidgetVisible}
            onToggleCardWidgetVisible={() => setCardWidgetVisible(!isCardWidgetVisible)}
            isDiceVisible={isDiceVisible}
            onToggleDiceVisible={() => setDiceVisible(!isDiceVisible)}
            isCoinVisible={isCoinVisible}
            onToggleCoinVisible={() => setCoinVisible(!isCoinVisible)}
            isLPVisible={isLPVisible}
            onToggleLPVisible={() => setLPVisible(!isLPVisible)}
            initialLP={initialLP}
            onChangeInitialLP={setInitialLP}
            onlyShowPlayer1={onlyShowPlayer1}
            onToggleOnlyShowPlayer1={() => setOnlyShowPlayer1(!onlyShowPlayer1)}
            isSPMarkerVisible={isSPMarkerVisible}
            onToggleSPMarkerMode={toggleSPMarkerMode}
            onVerifyPermission={verifyPermissionAndScan}
          />
        )
      }

      {/* 6. Session Resume Overlay (Global) - Appears when we have a saved handle but no current access */}
      {
        !isSearchView && !hasAccess && !isScanning && !isLoading && savedRootName && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[5000] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="bg-[#0f111a] p-10 rounded-[2.5rem] border-2 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-[600px] w-full text-center animate-in zoom-in-95 duration-300 overflow-hidden">

              <h2 className="text-2xl font-black mb-3 text-white tracking-tight">セッションを再開しますか？</h2>
              <p className="text-gray-400 text-sm mb-10 leading-relaxed px-4">
                セキュリティ保護のため、前回接続したカード画像フォルダ<br />
                <span className="text-blue-400 font-bold px-2 py-1 bg-blue-400/10 rounded-md mt-2 inline-block">「{savedRootName}」</span><br />
                へのアクセスをあらためて許可してください。
              </p>

              <div className="space-y-4">
                <button
                  onClick={verifyPermissionAndScan}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-900/30 flex items-center justify-center gap-3 group"
                >
                  <Layers size={22} className="group-hover:rotate-12 transition-transform" />
                  アクセスを許可して開始
                </button>

                <div className="flex flex-row items-center gap-3">
                  <button
                    onClick={requestAccess}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold text-xs transition-all border border-white/10 whitespace-nowrap"
                  >
                    別のフォルダに接続
                  </button>
                  <div className="w-px h-6 bg-black flex-shrink-0" />
                  <button
                    onClick={dropAccess}
                    className="flex-1 py-2.5 bg-red-900/10 hover:bg-red-900/20 text-red-400 rounded-xl font-bold text-xs transition-all border border-red-900/20 whitespace-nowrap"
                  >
                    拒否する
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Debug Info (DEV only) */}
      {
        import.meta.env.DEV && !isSearchView && (
          <div className="fixed bottom-4 left-4 z-[9999] bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10 text-[10px] font-mono text-white/70 pointer-events-none space-y-1">
            <div className="flex justify-between gap-4">
              <span>selectedCard:</span>
              <span className="text-blue-400">{selectedCard ? selectedCard.name : 'null'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>pinnedCards:</span>
              <span className="text-purple-400">{pinnedCards.length} cards</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>displayCardNo:</span>
              <span className="text-yellow-400 font-bold">{displayCardNo}</span>
            </div>
          </div>
        )
      }

      {!isSearchView && <MoveableController />}
      {!isSearchView && <SelectionActionBar />}
    </div >
  );
}

export default App;
