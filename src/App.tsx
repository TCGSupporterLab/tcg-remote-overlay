import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { get, set, del } from 'idb-keyval';

import { LPCalculator } from './components/LPCalculator';

import { useCardSearch, restoreFolderCache } from './hooks/useCardSearch';
import { useWidgetStore } from './store/useWidgetStore';
import { VideoBackground } from './components/VideoBackground';
import { type VideoSourceType, DEFAULT_CROP } from './types/widgetTypes';
import { SettingsMenu } from './components/SettingsMenu';
import { type TabType } from './components/SettingsMenu/SettingsTabs';
import { OverlayWidget } from './components/OverlayWidget';
import { SPMarkerWidget } from './components/CardSearch/SPMarkerWidget';
import { useLocalCards, analyzeZip, type ZipMetadata } from './hooks/useLocalCards';
import { CardSearchContainer } from './components/CardSearch/CardSearchContainer';
import { CardWidget } from './components/CardSearch/CardWidget';
import { OverlayDisplay } from './components/OverlayDisplay';
import { useWidgetSelection } from './hooks/useWidgetSelection';
import { MoveableController } from './components/MoveableController';
import { SelectionActionBar } from './components/SelectionActionBar';
import { SaveLayoutDialog } from './components/SaveLayoutDialog';
import { type WidgetId, type WidgetGroup } from './types/widgetTypes';
import { Layers, RefreshCw, AlertCircle } from 'lucide-react';
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
    isLoading,
    scanDirectory,
    unzipAndSave
  } = useLocalCards();

  const {
    isSyncing,
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
  const selectedCameraId = useWidgetStore(s => s.selectedCameraId);
  const availableCameras = useWidgetStore(s => s.availableCameras);
  const groupData = useWidgetStore(s => s.groupData);
  const selectedWidgetIds = useWidgetStore(s => s.selectedWidgetIds);
  const simpleCardImageUrl = useWidgetStore(s => s.simpleCardImageUrl);
  const myLayouts = useWidgetStore(s => s.myLayouts);

  const setVisibility = useWidgetStore(s => s.setVisibility);
  const setSettings = useWidgetStore(s => s.setSettings);
  const setObsMode = useWidgetStore(s => s.setObsMode);
  const setVideoSource = useWidgetStore(s => s.setVideoSource);
  const setVideoCrop = useWidgetStore(s => s.setVideoCrop);
  const setDiceValue = useWidgetStore(s => s.setDiceValue);
  const setCoinValue = useWidgetStore(s => s.setCoinValue);
  const setSelectedWidgets = useWidgetStore(s => s.setSelectedWidgets);
  const setSelectedCameraId = useWidgetStore(s => s.setSelectedCameraId);
  const setAvailableCameras = useWidgetStore(s => s.setAvailableCameras);
  const importDefaultLayouts = useWidgetStore(s => s.importDefaultLayouts);
  const resetWidgetPosition = useWidgetStore(s => s.resetWidgetPosition);
  const hideSelectedWidgets = useWidgetStore(s => s.hideSelectedWidgets);
  const setSimpleCardImageUrl = useWidgetStore(s => s.setSimpleCardImageUrl);
  const applyLayout = useWidgetStore(s => s.applyLayout);
  const fullReset = useWidgetStore(s => s.fullReset);

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
    spMarkerFace,
    lpTargetPlayer,
  } = settings;

  // Actions for compatibility or simplified calling
  const setDiceVisible = (val: boolean) => setVisibility({ isDiceVisible: val });
  const setCoinVisible = (val: boolean) => setVisibility({ isCoinVisible: val });
  const setLPVisible = (val: boolean) => setVisibility({ isLPVisible: val });
  const setCardWidgetVisible = (val: boolean) => setVisibility({ isCardWidgetVisible: val });
  const setInitialLP = (val: number) => setSettings({ initialLP: val });
  const setOnlyShowPlayer1 = (val: boolean) => setSettings({ onlyShowPlayer1: val });
  const toggleSPMarkerMode = () => setVisibility({ isSPMarkerVisible: !isSPMarkerVisible });
  const toggleSPMarkerFace = () => setSettings({ spMarkerFace: spMarkerFace === 'front' ? 'back' : 'front' });
  const toggleSPMarkerForceHidden = () => setVisibility({ showSPMarkerForceHidden: !showSPMarkerForceHidden });
  const setLPTargetPlayer = (val: 'p1' | 'p2' | null) => {
    if (val !== null) setSettings({ lpTargetPlayer: val });
  };

  // Sync folder name for caching logic
  useEffect(() => {
    if (isLoading) return; // スキャン準備が整うまで待機

    const currentName = rootHandle?.name || savedRootName || '';
    if (currentName !== rootFolderName) {
      setRootFolderName(currentName);
      // フォルダ接続時または切り替え時にキャッシュから復元
      if (currentName) {
        restoreFolderCache(currentName);
      }
    }
  }, [isLoading, rootHandle?.name, savedRootName, rootFolderName, setRootFolderName]);

  useEffect(() => {
    importDefaultLayouts();
  }, [importDefaultLayouts]);


  const [diceKey, setDiceKey] = useState(0); // For forcing re-render of dice roll animation
  const [coinKey, setCoinKey] = useState(0);

  const [isAdjustingVideo, setIsAdjustingVideo] = useState(false);
  const [showSettings, setShowSettings] = useState(() => !useWidgetStore.getState().settings.hideSettingsOnStart);
  const [activeSettingsTab, setActiveSettingsTab] = useState<TabType>('widgets');

  // Layout Saving Dialog State
  const [saveDialog, setSaveDialog] = useState<{
    isOpen: boolean;
    source: 'action-bar' | 'video-menu' | 'settings';
    initialOptions?: { includeWidgets: boolean, includeVideo: boolean, hideOthers: boolean };
  }>({
    isOpen: false,
    source: 'settings'
  });
  const [pendingZip, setPendingZip] = useState<{ file: File; metadata: ZipMetadata } | null>(null);

  const handleUnzipRequest = useCallback(async (file: File) => {
    // 1. まず必要最低限の情報でモーダルをすぐ出す
    const initialMetadata: ZipMetadata = {
      fileName: file.name,
      fileCount: 0,
      topFolders: [],
      isSingleRoot: false,
      rootName: null,
      isAnalyzing: true
    };
    setPendingZip({ file, metadata: initialMetadata });

    try {
      // 2. 非同期で解析。進捗（枚数）を動的に更新
      const metadata = await analyzeZip(file, (count) => {
        setPendingZip(current => {
          if (!current || current.file !== file) return current;
          return {
            ...current,
            metadata: { ...current.metadata, fileCount: count }
          };
        });
      });

      // 3. 解析完了。最終的なメタデータをセット
      setPendingZip(current => {
        if (!current || current.file !== file) return current;
        return { file, metadata };
      });
    } catch (e: any) {
      setPendingZip(null);
      alert(`ZIPファイルの解析に失敗しました: ${e.message}`);
    }
  }, []);

  const openSaveDialog = useCallback((
    source: 'action-bar' | 'video-menu' | 'settings',
    initialOptions?: { includeWidgets: boolean, includeVideo: boolean, hideOthers: boolean }
  ) => {
    setSaveDialog({ isOpen: true, source, initialOptions });
  }, []);

  const saveLayoutAction = useWidgetStore(s => s.saveLayout);
  const handleSaveLayout = useCallback((name: string, options: { includeWidgets: boolean, includeVideo: boolean, hideOthers: boolean }) => {
    // 選択アクションバーから呼び出された場合は、選択中のウィジェットのみを対象とする
    const allWidgets = saveDialog.source !== 'action-bar';
    saveLayoutAction(name, { ...options, allWidgets });
  }, [saveLayoutAction, saveDialog.source]);

  // Widget Selection & Grouping
  const {
    clearSelection,
  } = useWidgetSelection();

  const toggleAdjustmentMode = useCallback(() => {
    const next = !isAdjustingVideo;
    if (next) {
      clearSelection();
    }
    setIsAdjustingVideo(next);
  }, [isAdjustingVideo, clearSelection]);

  const widgetRefsMap = useRef<Map<WidgetId, HTMLDivElement>>(new Map());
  const containerRefCallback = useCallback((id: WidgetId, el: HTMLDivElement | null) => {
    if (el) {
      widgetRefsMap.current.set(id, el);
    } else {
      widgetRefsMap.current.delete(id);
    }
  }, []);


  // Find group for a widget
  const findGroupForWidget = useCallback((widgetId: WidgetId): WidgetGroup | undefined => {
    return groupData.groups.find(g => g.memberIds.includes(widgetId));
  }, [groupData]);


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


  // Apply OBS mode class to body
  useEffect(() => {
    document.body.classList.remove('obs-green');
    if (obsMode === 'green') {
      document.body.classList.add('obs-green');
    }
  }, [obsMode]);

  // Persistent Tool State
  const dotTimerRef = useRef<number | undefined>(undefined);
  const lastDotTapRef = useRef<number>(0);
  const oTimerRef = useRef<number | undefined>(undefined); // Added
  const lastOTapRef = useRef<number>(0); // Added
  const rPressTimerRef = useRef<number | undefined>(undefined);
  const displayCardNoBufferRef = useRef<string>("");
  const displayCardNoTimerRef = useRef<number | undefined>(undefined);
  const layoutBufferRef = useRef<string>("");
  const layoutTimerRef = useRef<number | undefined>(undefined);
  // View mode detection
  const searchViewParam = new URLSearchParams(window.location.search).get('view');
  const isSearchView = searchViewParam === 'search';
  const [isTerminated, setIsTerminated] = useState(false);

  // Simple Card Image Selection logic
  const simpleFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSimpleFile = useCallback(async (file: File) => {
    try {
      // 1. 保存
      await set('tcg_remote_simple_card_blob', file);

      // 2. State更新
      setSettings({
        simpleCardImage: { name: file.name, type: file.type }
      });

      // 3. ObjectURL作成
      if (simpleCardImageUrl) URL.revokeObjectURL(simpleCardImageUrl);
      const url = URL.createObjectURL(file);
      setSimpleCardImageUrl(url);

      if (import.meta.env.DEV) console.log(`[App] Processed simple card image: ${file.name}`);
    } catch (err) {
      console.error('Failed to process simple card image:', err);
    }
  }, [simpleCardImageUrl, setSettings, setSimpleCardImageUrl]);

  const handleSimpleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleSimpleFile(file);
  }, [handleSimpleFile]);

  const handleClearSimpleCard = useCallback(async () => {
    try {
      await del('tcg_remote_simple_card_blob');
      if (simpleCardImageUrl) URL.revokeObjectURL(simpleCardImageUrl);
      setSimpleCardImageUrl(null);
      setSettings({ simpleCardImage: undefined });
      if (import.meta.env.DEV) console.log(`[App] Cleared simple card image`);
    } catch (err) {
      console.error('Failed to clear simple card image:', err);
    }
  }, [simpleCardImageUrl, setSimpleCardImageUrl, setSettings]);

  // Load simple card image on mount
  useEffect(() => {
    const loadSimpleCard = async () => {
      try {
        const blob = await get<Blob>('tcg_remote_simple_card_blob');
        if (blob) {
          const url = URL.createObjectURL(blob);
          setSimpleCardImageUrl(url);
          if (import.meta.env.DEV) console.log(`[App] Loaded simple card image from IDB`);
        }
      } catch (err) {
        console.error('Failed to load simple card image from IDB:', err);
      }
    };
    loadSimpleCard();

    return () => {
      if (simpleCardImageUrl) URL.revokeObjectURL(simpleCardImageUrl);
    };
  }, [setSimpleCardImageUrl]); // Once on mount

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



  const handleRollDice = useCallback(() => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const result = ((array[0] % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
    setDiceValue(result);
    setDiceKey(prev => prev + 1);
  }, [setDiceValue]);

  const handleFlipCoin = useCallback(() => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const result = (array[0] % 2) as 1 | 0;
    setCoinValue(result);
    setCoinKey(prev => prev + 1);
  }, [setCoinValue]);


  const toggleVideoSource = useCallback((reverse = false) => {
    const sources: VideoSourceType[] = ['none', 'camera', 'screen'];
    const currentIndex = sources.indexOf(videoSource);
    const step = reverse ? -1 : 1;
    const nextIndex = (currentIndex + step + sources.length) % sources.length;
    const nextSource = sources[nextIndex];
    setVideoSource(nextSource);
  }, [videoSource, setVideoSource]);


  // Keyboard Shortcuts & Global Context Menu
  useEffect(() => {
    // Prevent default right click menu and instead open settings
    const handleContextMenu = (e: MouseEvent) => {
      // Allow right click interacting with an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
      if (e.repeat) return;

      // Settings / Selection toggle
      if (e.key === 'Escape') {
        if (selectedWidgetIds.length > 0) {
          clearSelection();
          return;
        }
        setShowSettings(prev => !prev);
        return;
      }

      // Handle Delete (Hide Selected Widgets)
      if (e.key === 'Delete') {
        if (selectedWidgetIds.length > 0) {
          e.preventDefault();
          hideSelectedWidgets();
          return;
        }
      }

      // Handle Ctrl+A (Select All Widgets)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        // Get all widget containers currently in the DOM
        const allWidgets = document.querySelectorAll('[data-widget-id]');
        const ids = Array.from(allWidgets)
          .map(el => el.getAttribute('data-widget-id'))
          .filter((id): id is string => id !== null);

        if (ids.length > 0) {
          setSelectedWidgets(ids);
          if (import.meta.env.DEV) {
            console.log(`[Shortcut] Select All: found ${ids.length} widgets`);
          }
        }
        return;
      }

      // Allow hotkeys only if settings are closed
      if (showSettings) return;

      // Ignore single-key shortcuts if Ctrl, Meta, or Alt is held
      // (Alt is allowed if it's a digit key for layout switching)
      const digitMatch = e.code.match(/^(Digit|Numpad)(\d)$/);
      if (e.ctrlKey || e.metaKey || (e.altKey && !digitMatch)) return;

      if (e.key === 'd' || e.key === 'D') {
        handleRollDice();
      }
      if (e.key === 'c' || e.key === 'C') {
        handleFlipCoin();
      }
      if (e.key === 'v' || e.key === 'V') {
        toggleVideoSource(e.shiftKey);
      }
      if (e.key === 'a' || e.key === 'A') {
        toggleAdjustmentMode();
      }



      // Reset Long Press (1.5s)
      if (e.key === 'r' || e.key === 'R') {
        if (!rPressTimerRef.current) {
          if (import.meta.env.DEV) console.log("[Shortcut] R key pressed, starting long press timer...");
          rPressTimerRef.current = window.setTimeout(() => {
            fullReset();
            rPressTimerRef.current = undefined;
            if (import.meta.env.DEV) console.log('[App] Full reset triggered by R long press');
          }, 1500);
        }
      }
      // SP Marker Shortcuts (O: Flip, Double tap: Temporary Toggle)
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        const now = Date.now();
        const diff = now - lastOTapRef.current;

        if (diff > 0 && diff < 200) {
          // Double tap!
          if (oTimerRef.current) {
            window.clearTimeout(oTimerRef.current);
            oTimerRef.current = undefined;
          }
          toggleSPMarkerForceHidden();
          lastOTapRef.current = 0; // Reset
        } else {
          // First tap or outside double-tap window
          lastOTapRef.current = now;
          if (oTimerRef.current) window.clearTimeout(oTimerRef.current);
          oTimerRef.current = window.setTimeout(() => {
            toggleSPMarkerFace();
            oTimerRef.current = undefined;
            lastOTapRef.current = 0;
          }, 200);
        }
      }



      // Numpad "." (Roll Dice / Double tap for Coin)
      if (e.key === '.' || e.key === 'Decimal' || e.code === 'NumpadDecimal') {
        e.preventDefault();
        const now = Date.now();
        const diff = now - lastDotTapRef.current;

        if (diff > 0 && diff < 150) {
          // Double tap!
          if (dotTimerRef.current) {
            window.clearTimeout(dotTimerRef.current);
            dotTimerRef.current = undefined;
          }
          handleFlipCoin();
          lastDotTapRef.current = 0; // Reset
        } else {
          // First tap or outside double-tap window
          lastDotTapRef.current = now;
          if (dotTimerRef.current) window.clearTimeout(dotTimerRef.current);
          dotTimerRef.current = window.setTimeout(() => {
            handleRollDice();
            dotTimerRef.current = undefined;
            lastDotTapRef.current = 0;
          }, 150);
        }
      }


      // Number keys (Digit0-9 or Numpad0-9) for Selection / Layouts
      if (digitMatch) {
        // Alt + Number keys for Layout selection
        // Support multi-digit input by buffering digits within a 200ms window
        if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          const digit = digitMatch[2];

          if (layoutTimerRef.current) {
            window.clearTimeout(layoutTimerRef.current);
          } else {
            layoutBufferRef.current = "";
          }

          layoutBufferRef.current += digit;

          const num = parseInt(layoutBufferRef.current, 10);
          if (!isNaN(num) && myLayouts[num]) {
            applyLayout(myLayouts[num].id);
            if (import.meta.env.DEV) console.log(`[Shortcut] Applied layout at index ${num}: ${myLayouts[num].name}`);
          }

          layoutTimerRef.current = window.setTimeout(() => {
            layoutBufferRef.current = "";
            layoutTimerRef.current = undefined;
          }, 200);
          return;
        }

        // Shift + Number keys (Digit0-9 or Numpad0-9) for Display Card Number
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
            displayCardNoTimerRef.current = undefined;
          }, 200); // Match Hololive card selection window (200ms)
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Middle click (button 1)
      if (e.button === 1) {
        // If interactive element, allow default behavior (though usually middle click doesn't have much)
        const target = e.target as HTMLElement;
        if (target.closest?.('button, a, kbd, input, select, textarea')) return;

        e.preventDefault();
        toggleAdjustmentMode();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        if (rPressTimerRef.current) {
          window.clearTimeout(rPressTimerRef.current);
          rPressTimerRef.current = undefined;
          if (import.meta.env.DEV) console.log("[Shortcut] R key released, timer cancelled");
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mousedown', handleMouseDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [handleRollDice, handleFlipCoin, toggleVideoSource, toggleAdjustmentMode, toggleSPMarkerFace, toggleSPMarkerForceHidden, showSettings, isAdjustingVideo, setDisplayCardNo, selectedWidgetIds, clearSelection, setSelectedWidgets, fullReset, myLayouts, applyLayout]);


  if (import.meta.env.DEV) {
    useEffect(() => {
      console.log(`[App] Global State - isScanning: ${isScanning}, isLoading: ${isLoading}, hasAccess: ${hasAccess}, isSyncing: ${isSyncing}`);
      console.log(`[App] Overlay Condition: ${isScanning || isSyncing || (isLoading && (hasAccess || !rootHandle))}`);
    }, [isScanning, isLoading, hasAccess, isSyncing, rootHandle, isSyncing]);
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
      <div className="flex flex-col gap-4">
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
    <div className={`app-container w-full h-full flex flex-col box-border overlay-mode p-0 relative ${isAdjustingVideo ? 'video-adjustment-active video-adjustment-overlay' : ''}`}>
      <VideoBackground
        sourceType={videoSource}
        cropConfig={videoCrop}
        onCropChange={setVideoCrop}
        onReset={() => setVideoCrop(DEFAULT_CROP)}
        onClose={() => setIsAdjustingVideo(false)}
        isAdjustmentMode={isAdjustingVideo}
        onOpenSaveDialog={openSaveDialog}
        selectedCameraId={selectedCameraId}
        onCameraIdChange={setSelectedCameraId}
        availableCameras={availableCameras}
        onCamerasUpdate={setAvailableCameras}
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
              onSelectSimpleCard={() => simpleFileInputRef.current?.click()}
              onDropFile={(file) => {
                setSettings({ cardMode: 'simple' });
                handleSimpleFile(file);
              }}
              onDropFolder={async (handle) => {
                setSettings({ cardMode: 'library' });
                await set('tcg_remote_root_handle', handle);
                scanDirectory(handle);
              }}
              onUnzipZIP={(file) => {
                setSettings({ cardMode: 'library' });
                handleUnzipRequest(file);
              }}
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
                targetPlayer={lpTargetPlayer}
                onTargetPlayerChange={setLPTargetPlayer}
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


      <MoveableController
        effectiveSelectionMembers={effectiveSelectionMembers}
        widgetRefsMap={widgetRefsMap}
        isAdjustingVideo={isAdjustingVideo}
      />

      {!isSearchView && <SelectionActionBar onOpenSaveDialog={openSaveDialog} />}

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
            onOpenSaveDialog={openSaveDialog}
            obsMode={obsMode}
            onObsModeChange={setObsMode}
            availableCameras={availableCameras}
            selectedCameraId={selectedCameraId}
            onCameraIdChange={setSelectedCameraId}
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
            onResetWidgetPosition={resetWidgetPosition}
            onFullReset={fullReset}
            hideSettingsOnStart={settings.hideSettingsOnStart}
            onToggleHideSettingsOnStart={(val) => setSettings({ hideSettingsOnStart: val })}
            cardMode={settings.cardMode}
            onCardModeChange={(mode) => setSettings({ cardMode: mode })}
            onSelectSimpleCard={() => simpleFileInputRef.current?.click()}
            onClearSimpleCard={handleClearSimpleCard}
            simpleCardImageName={settings.simpleCardImage?.name}
            onUnzipZIP={handleUnzipRequest}
          />
        )
      }

      {/* ZIP Confirmation Modal */}
      {pendingZip && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300 app-modal-overlay">
          <div
            className="w-[680px] bg-[#1a1c26] border-2 border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-[20px] py-[10px] space-y-[40px]">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-blue-400">
                  <RefreshCw size={24} className="animate-spin-slow" />
                  <h2 className="text-xl font-bold tracking-tight">ZIPファイルを検出</h2>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  アーカイブの内容をローカルフォルダへ展開し、カードライブラリとして読み込みます。
                </p>
              </div>

              <div className="bg-black/30 rounded-2xl px-8 py-6 border border-white/5 space-y-4">
                <div className="flex items-baseline gap-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest w-[80px] shrink-0">ファイル名</span>
                  <span className="text-sm font-semibold text-gray-200 truncate">{pendingZip.metadata.fileName}</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest w-[80px] shrink-0">解析状況</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${pendingZip.metadata.fileCount > 0 ? "text-blue-400" : "text-yellow-500"}`}>
                      {pendingZip.metadata.isAnalyzing
                        ? pendingZip.metadata.fileCount > 0
                          ? `カードを解析中 (${pendingZip.metadata.fileCount.toLocaleString()} 枚)`
                          : "システムによる安全確認を待機中..."
                        : `解析完了 (${pendingZip.metadata.fileCount.toLocaleString()} 枚)`}
                    </span>
                    {pendingZip.metadata.isAnalyzing && (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] text-blue-400 font-bold animate-pulse">
                        <RefreshCw size={10} className="animate-spin" />
                        {pendingZip.metadata.fileCount > 0 ? "走査中" : "待機中"}
                      </span>
                    )}
                  </div>
                </div>

                {pendingZip.metadata.isAnalyzing && pendingZip.metadata.fileCount === 0 && (
                  <div className="px-4 py-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                    <p className="text-[11px] text-yellow-500/90 leading-relaxed">
                      💡 <strong>ヒント</strong>: インターネットから取得したZIPはWindowsの保護により読み込みが制限される場合があります。
                      プロパティから「ブロック解除」を行うか、ローカルで作成したZIPを利用すると一瞬で読み込めます。
                    </p>
                  </div>
                )}
                {!pendingZip.metadata.isAnalyzing && !pendingZip.metadata.isValid && (
                  <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                    <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-red-400 font-bold leading-relaxed">
                      {pendingZip.metadata.error || "不適切なフォルダ構成です。"}
                    </p>
                  </div>
                )}
                {pendingZip.metadata.shouldStrip && (
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[10px] text-yellow-500/80 italic">
                      ※ トップレベルの "{pendingZip.metadata.rootName}" フォルダは自動的に省略されます。
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons - Flushed with container padding */}
              <div className="flex flex-col gap-[1px] mx-[-20px] mb-[-10px] mt-2 border-t border-white/10 overflow-hidden">
                <button
                  onClick={async () => {
                    if (!pendingZip.metadata.isValid) return;
                    const file = pendingZip.file;
                    setPendingZip(null);
                    await unzipAndSave(file);
                    // 展開とスキャンが完了したら自動的に設定メニューを閉じる
                    setShowSettings(false);
                  }}
                  disabled={pendingZip.metadata.isAnalyzing || !pendingZip.metadata.isValid}
                  className={`w-full py-[20px] font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${pendingZip.metadata.isAnalyzing || !pendingZip.metadata.isValid
                    ? "bg-gray-600/50 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white active:bg-blue-700"
                    }`}
                >
                  {pendingZip.metadata.isAnalyzing
                    ? "解析を待機中..."
                    : !pendingZip.metadata.isValid
                      ? "構成が不適切です"
                      : "展開先フォルダを選択して開始"}
                </button>
                <button
                  onClick={() => setPendingZip(null)}
                  className="w-full py-[14px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 font-semibold text-[14px] transition-all"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Session Resume Overlay (Global) - Appears when we have a saved handle but no current access */}
      {
        !isSearchView && !hasAccess && !isScanning && !isLoading && savedRootName && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[5000] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 app-modal-overlay">
            <div className="bg-[#0f111a] p-10 rounded-[2.5rem] border-2 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-[600px] w-full text-center animate-in zoom-in-95 duration-300 overflow-hidden">

              <h2 className="text-2xl font-black mb-3 text-white tracking-tight">セッションを再開しますか？</h2>
              <p className="text-gray-400 text-sm mb-10 leading-relaxed px-4">
                セキュリティ保護のため、前回接続したカード画像フォルダ<br />
                <span className="text-blue-400 font-bold px-2 py-1 bg-blue-400/10 rounded-md mt-2 inline-block">「{savedRootName}」</span><br />
                へのアクセスをあらためて許可してください。
              </p>

              <div className="flex flex-col gap-4 max-w-[320px] mx-auto">
                <button
                  onClick={verifyPermissionAndScan}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  アクセスを許可して開始
                </button>
                <button
                  onClick={dropAccess}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-bold transition-all border border-white/5"
                >
                  別のフォルダを選択
                </button>
              </div>

            </div>
          </div>
        )
      }

      {/* Layout Save Dialog */}
      <input
        type="file"
        ref={simpleFileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleSimpleFileSelect}
      />

      <SaveLayoutDialog
        isOpen={saveDialog.isOpen}
        source={saveDialog.source}
        initialOptions={saveDialog.initialOptions}
        onClose={() => setSaveDialog(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveLayout}
      />
    </div>
  );
}

export default App;
