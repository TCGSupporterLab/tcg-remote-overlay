import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { YugiohTools } from './components/YugiohTools';

import { useCardSearch, restoreFolderCache } from './hooks/useCardSearch';
import { VideoBackground, type VideoSourceType, type CropConfig } from './components/VideoBackground';
import { SettingsMenu } from './components/SettingsMenu';
import { OverlayWidget } from './components/OverlayWidget';
import { SPMarkerWidget } from './components/CardSearch/SPMarkerWidget';
import { useLocalCards } from './hooks/useLocalCards';
import { CardSearchContainer } from './components/CardSearch/CardSearchContainer';
import { CardWidget } from './components/CardSearch/CardWidget';
import { OverlayDisplay } from './components/OverlayDisplay';
import { GroupBoundingBox } from './components/GroupBoundingBox';
import { useWidgetSelection } from './hooks/useWidgetSelection';
import type { WidgetId, WidgetState, WidgetGroupData, WidgetGroup, RelativeTransform } from './types/widgetTypes';
import { Layers, RefreshCw } from 'lucide-react';
import './App.css';

type GameMode = 'yugioh' | 'hololive' | 'none';
type ObsMode = 'normal' | 'green';

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
    isSPMarkerVisible,
    spMarkerFace,
    toggleSPMarkerMode,
    toggleSPMarkerFace,
    toggleSPMarkerForceHidden,
    showSPMarkerForceHidden,
    isSyncing,
    pinnedCards,
    selectedCard,
    displayCardNo,
    setDisplayCardNo,
    isDiceVisible,
    setIsDiceVisible,
    isCoinVisible,
    setIsCoinVisible,
    isLPVisible,
    setIsLPVisible,
    isCardWidgetVisible,
    setIsCardWidgetVisible,
    initialLP,
    setInitialLP,
    onlyShowPlayer1,
    setOnlyShowPlayer1,
    rootFolderName,
    setRootFolderName
  } = useCardSearch(cards, metadataOrder, mergeSameFileCards);

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

  // Widget Selection & Grouping
  const {
    selectedWidgetIds,
    isSelecting,
    selectionRect,
    toggleSelect,
    startRectSelection,
    updateRectSelection,
    finishRectSelection,
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

  const getWidgetRects = useCallback(() => {
    const rects = new Map<WidgetId, DOMRect>();
    widgetRefsMap.current.forEach((el, id) => {
      rects.set(id, el.getBoundingClientRect());
    });
    return rects;
  }, []);

  // Group Data (persisted)
  const [groupData, setGroupData] = useState<WidgetGroupData>(() => {
    const saved = localStorage.getItem('widget_groups');
    return saved ? JSON.parse(saved) : { groups: [], relativeTransforms: {} };
  });

  // Persist group data
  useEffect(() => {
    localStorage.setItem('widget_groups', JSON.stringify(groupData));
    const channel = new BroadcastChannel('tcg_remote_sync');
    channel.postMessage({ type: 'WIDGET_GROUP_UPDATE', value: groupData, senderId: TAB_ID });
    channel.close();
  }, [groupData]);


  // Sync group data from other windows
  useEffect(() => {
    const channel = new BroadcastChannel('tcg_remote_sync');
    const handler = (e: MessageEvent) => {
      if (e.data.senderId === TAB_ID) return; // Prevent loopback

      if (e.data.type === 'WIDGET_GROUP_UPDATE') {
        const newValue = e.data.value;
        // Deep equality check for group data to prevent infinite reload loops
        if (JSON.stringify(groupData) !== JSON.stringify(newValue)) {
          setGroupData(newValue);
        }
      }

      if (e.data.type === 'WIDGET_STATE_UPDATE') {
        const { gameMode: widgetId, state: newState } = e.data.value;
        // Sync external window's widget state to our live cache immediately
        liveWidgetStatesRef.current[widgetId as WidgetId] = newState;
      }
    };

    channel.addEventListener('message', handler);
    return () => { channel.removeEventListener('message', handler); channel.close(); };
  }, [groupData]);



  // External state map for group member sync
  const [externalStates, setExternalStates] = useState<Record<WidgetId, WidgetState>>({});

  // Fix for rotation drift and infinite loop stabilization
  const manipulationStartStatesRef = useRef<Record<WidgetId, WidgetState>>({});

  // Cache for all widgets to avoid localStorage reads during manipulation
  const liveWidgetStatesRef = useRef<Record<WidgetId, WidgetState>>({});

  // Initialize cache from localStorage
  useEffect(() => {
    const ids = ["card_widget", "yugioh", "hololive_sp_marker", "dice", "coin"];
    const initial: Record<WidgetId, WidgetState> = {};
    ids.forEach(id => {
      const saved = localStorage.getItem(`overlay_widget_v4_${id}`);
      if (saved) initial[id as WidgetId] = JSON.parse(saved);
    });
    liveWidgetStatesRef.current = initial;
  }, []);

  const handleManipulationStart = useCallback(() => {
    // CAPTURE CURRENT LIVE STATES as the start points for manipulation
    // We no longer read localStorage here because liveWidgetStatesRef is 
    // strictly updated on every change/sync message.
    manipulationStartStatesRef.current = { ...liveWidgetStatesRef.current };

    if (import.meta.env.DEV) {
      console.log("[App] Manipulation Start Snapshot (Unified Cache):", manipulationStartStatesRef.current);
    }
  }, []);




  // Widget visibility map
  const getVisibilityMap = useCallback((): Record<WidgetId, boolean> => ({
    card_widget: isCardWidgetVisible,
    yugioh: isLPVisible,
    hololive_sp_marker: isSPMarkerVisible && !showSPMarkerForceHidden,
    dice: isDiceVisible,
    coin: isCoinVisible,
  }), [isCardWidgetVisible, isLPVisible, isSPMarkerVisible, showSPMarkerForceHidden, isDiceVisible, isCoinVisible]);

  // Resolve active anchor (handles hidden anchor)
  const resolveActiveAnchor = useCallback((group: WidgetGroup): WidgetId | null => {
    const vis = getVisibilityMap();
    if (vis[group.anchorId]) return group.anchorId;
    return group.memberIds.find(id => vis[id]) ?? null;
  }, [getVisibilityMap]);

  // Find group for a widget
  const findGroupForWidget = useCallback((widgetId: WidgetId): WidgetGroup | undefined => {
    return groupData.groups.find(g => g.memberIds.includes(widgetId));
  }, [groupData]);

  // Group widgets
  const groupWidgets = useCallback((widgetIds: WidgetId[]) => {
    if (widgetIds.length < 2) return;

    const groupId = crypto.randomUUID();
    const anchorId = widgetIds[0];

    // Read current states from localStorage
    const states: Record<WidgetId, WidgetState> = {};
    for (const id of widgetIds) {
      const saved = localStorage.getItem(`overlay_widget_v4_${id}`);
      states[id] = saved ? JSON.parse(saved) : { px: 0, py: 0, scale: 1, rotation: 0 };
    }

    const anchorState = states[anchorId];
    const newRelativeTransforms: Record<WidgetId, RelativeTransform> = {};

    const aspect = window.innerWidth / window.innerHeight;

    for (const id of widgetIds) {
      if (id === anchorId) {
        newRelativeTransforms[id] = { dx: 0, dy: 0, dRotation: 0, dScale: 1 };
      } else {
        const dx_world = (states[id].px - anchorState.px) * aspect;
        const dy_world = states[id].py - anchorState.py;
        const rad = -anchorState.rotation * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        newRelativeTransforms[id] = {
          dx: (dx_world * cos - dy_world * sin) / anchorState.scale,
          dy: (dx_world * sin + dy_world * cos) / anchorState.scale,
          dRotation: states[id].rotation - anchorState.rotation,
          dScale: anchorState.scale !== 0 ? states[id].scale / anchorState.scale : 1,
        };
      }
    }

    const newGroup: WidgetGroup = { id: groupId, memberIds: widgetIds, anchorId };

    setGroupData(prev => ({
      groups: [...prev.groups, newGroup],
      relativeTransforms: { ...prev.relativeTransforms, ...newRelativeTransforms },
    }));

    clearSelection();
  }, [clearSelection]);

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
      effectiveSelectionMembers.forEach(id => {
        const s = localStorage.getItem(`overlay_widget_v4_${id}`);
        if (s) {
          const st = JSON.parse(s);
          console.log(`[SelectionDebug] State [${id}]: px=${st.px.toFixed(4)}, py=${st.py.toFixed(4)}, rot=${st.rotation.toFixed(1)}`);
        }
      });
    }
  }, [isMultiSelectionActive, effectiveSelectionMembers]);


  // Handle manipulation for any selection (even if not a formal group)
  const handleTransientDrag = useCallback((anchorId: WidgetId, newAnchorState: WidgetState) => {
    // 1. Get snapshot state from the start of manipulation
    const startStates = manipulationStartStatesRef.current;
    const anchorPrevState = startStates[anchorId];

    if (!anchorPrevState || !anchorPrevState.scale) {
      // Fallback if snapshot is missing for some reason
      const saved = localStorage.getItem(`overlay_widget_v4_${anchorId}`);
      if (!saved) return;
      const fallback = JSON.parse(saved);
      if (!fallback.scale) return;
      manipulationStartStatesRef.current[anchorId] = fallback;
      return;
    }

    const updates: Record<WidgetId, WidgetState> = {};
    updates[anchorId] = newAnchorState;

    // 2. Apply rigid transformation using start-of-drag snapshot
    const radPrev = -anchorPrevState.rotation * (Math.PI / 180);
    const cosPrev = Math.cos(radPrev);
    const sinPrev = Math.sin(radPrev);

    const radNew = newAnchorState.rotation * (Math.PI / 180);
    const cosNew = Math.cos(radNew);
    const sinNew = Math.sin(radNew);

    const aspect = window.innerWidth / window.innerHeight;

    for (const memberId of effectiveSelectionMembersRef.current) {
      if (memberId === anchorId) continue;

      const memberState = startStates[memberId];
      if (!memberState || !memberState.scale) continue;

      // Calculate relative position in anchor's ORIGINAL local space
      const dx_world = (memberState.px - anchorPrevState.px) * aspect;
      const dy_world = memberState.py - anchorPrevState.py;
      const lx = (dx_world * cosPrev - dy_world * sinPrev) / anchorPrevState.scale;
      const ly = (dx_world * sinPrev + dy_world * cosPrev) / anchorPrevState.scale;

      // Map back to world space using anchor's NEW state
      const dx_new = (lx * cosNew - ly * sinNew) * newAnchorState.scale;
      const dy_new = (lx * sinNew + ly * cosNew) * newAnchorState.scale;

      const dr = memberState.rotation - anchorPrevState.rotation;
      const ds = memberState.scale / anchorPrevState.scale;

      updates[memberId] = {
        px: newAnchorState.px + (dx_new / aspect),
        py: newAnchorState.py + dy_new,
        rotation: newAnchorState.rotation + dr,
        scale: newAnchorState.scale * ds,
      };
    }


    setExternalStates(prev => {
      let changed = false;
      const next = { ...prev };
      for (const id in updates) {
        const u = updates[id as WidgetId];
        const p = prev[id as WidgetId];
        if (!p ||
          Math.abs(u.px - p.px) > 0.00001 ||
          Math.abs(u.py - p.py) > 0.00001 ||
          Math.abs(u.scale - p.scale) > 0.00001 ||
          Math.abs(u.rotation - p.rotation) > 0.00001) {
          next[id as WidgetId] = u;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);



  // Ungroup
  const ungroupWidgets = useCallback((groupId: string) => {
    setGroupData(prev => {
      const group = prev.groups.find(g => g.id === groupId);
      if (!group) return prev;
      // Clear external states for members so widgets return to self-managed state
      setExternalStates(prevStates => {
        const next = { ...prevStates };
        for (const id of group.memberIds) {
          delete next[id];
        }
        return next;
      });
      const newTransforms = { ...prev.relativeTransforms };
      for (const id of group.memberIds) {
        delete newTransforms[id];
      }
      return {
        groups: prev.groups.filter(g => g.id !== groupId),
        relativeTransforms: newTransforms,
      };
    });
  }, []);

  // Handle state change from anchor widget (propagate to group members)
  const handleWidgetStateChange = useCallback((id: WidgetId, newState: WidgetState) => {
    const group = groupData.groups.find(g => {
      const activeAnchor = resolveActiveAnchor(g);
      return activeAnchor === id;
    });
    if (!group) return;

    const newExternalStates: Record<WidgetId, WidgetState> = {};
    const rad = newState.rotation * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const aspect = window.innerWidth / window.innerHeight;

    for (const memberId of group.memberIds) {
      if (memberId === id) continue;
      const rel = groupData.relativeTransforms[memberId];
      if (!rel) continue;

      // Apply rigid transform using local offsets stored in rel.dx, rel.dy
      const dx_new = (rel.dx * cos - rel.dy * sin) * newState.scale;
      const dy_new = (rel.dx * sin + rel.dy * cos) * newState.scale;

      newExternalStates[memberId] = {
        px: newState.px + (dx_new / aspect),
        py: newState.py + dy_new,
        rotation: newState.rotation + rel.dRotation,
        scale: newState.scale * rel.dScale,
      };
    }
    setExternalStates(prev => {
      let changed = false;
      const next = { ...prev };
      // Also include the anchor's own new state in updates for local cache
      const updates = { ...newExternalStates, [id]: newState };

      for (const widgetId in updates) {
        const u = updates[widgetId as WidgetId];
        const p = prev[widgetId as WidgetId];

        // Also update the live cache
        liveWidgetStatesRef.current[widgetId as WidgetId] = u;

        if (!p ||
          Math.abs(u.px - p.px) > 0.00001 ||
          Math.abs(u.py - p.py) > 0.00001 ||
          Math.abs(u.scale - p.scale) > 0.00001 ||
          Math.abs(u.rotation - p.rotation) > 0.00001) {
          next[widgetId as WidgetId] = u;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [groupData, resolveActiveAnchor]);




  // Handle group drag (from GroupBoundingBox handles)
  const handleGroupDrag = useCallback((anchorId: WidgetId, newAnchorState: WidgetState) => {
    const group = groupData.groups.find(g => {
      const active = resolveActiveAnchor(g);
      return active === anchorId;
    });
    if (!group) return;

    const rad = newAnchorState.rotation * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const aspect = window.innerWidth / window.innerHeight;

    const updates: Record<WidgetId, WidgetState> = {};
    updates[anchorId] = newAnchorState;
    for (const memberId of group.memberIds) {
      if (memberId === anchorId) continue;
      const rel = groupData.relativeTransforms[memberId];
      if (!rel) continue;

      // Apply rigid transform
      const dx_new = (rel.dx * cos - rel.dy * sin) * newAnchorState.scale;
      const dy_new = (rel.dx * sin + rel.dy * cos) * newAnchorState.scale;

      updates[memberId] = {
        px: newAnchorState.px + (dx_new / aspect),
        py: newAnchorState.py + dy_new,
        rotation: newAnchorState.rotation + rel.dRotation,
        scale: newAnchorState.scale * rel.dScale,
      };
    }
    setExternalStates(prev => {
      let changed = false;
      const next = { ...prev };
      for (const id in updates) {
        const u = updates[id as WidgetId];
        const p = prev[id as WidgetId];
        if (!p ||
          Math.abs(u.px - p.px) > 0.00001 ||
          Math.abs(u.py - p.py) > 0.00001 ||
          Math.abs(u.scale - p.scale) > 0.00001 ||
          Math.abs(u.rotation - p.rotation) > 0.00001) {
          next[id as WidgetId] = u;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [groupData, resolveActiveAnchor]);


  // Helper to get group props for a widget
  const getGroupProps = useCallback((widgetId: WidgetId) => {
    const group = findGroupForWidget(widgetId);
    if (!group) return { isGrouped: false, groupId: undefined };
    return {
      isGrouped: true,
      groupId: group.id,
    };
  }, [findGroupForWidget]);


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

      // Settings / Selection toggle
      if (e.key === 'Escape') {
        if (selectedWidgetIds.size > 0) {
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
      if (gameMode === 'hololive' && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        toggleSPMarkerForceHidden();
      }

      // G key: Group selected widgets
      if ((e.key === 'g' || e.key === 'G') && selectedWidgetIds.size >= 2) {
        e.preventDefault();
        groupWidgets(Array.from(selectedWidgetIds));
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
  }, [gameMode, handleRollDice, handleFlipCoin, toggleVideoSource, toggleAdjustmentMode, toggleSPMarkerFace, toggleSPMarkerForceHidden, showSettings, isAdjustingVideo, setDisplayCardNo, selectedWidgetIds, clearSelection, groupWidgets]);


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
        style={{ pointerEvents: !isAdjustingVideo ? 'auto' : (isSelecting ? 'auto' : 'none') }}
        onMouseDown={(e) => {
          // Only start rect selection on direct background click (not on widgets)
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest('main') === e.currentTarget) {
            if (!(e.target as HTMLElement).closest('.pointer-events-auto')) {
              e.preventDefault(); // Prevent browser text selection
              startRectSelection(e);
            }
          }
        }}
        onMouseMove={(e) => {
          if (isSelecting) {
            updateRectSelection(e);
          }
        }}
        onMouseUp={() => {
          if (isSelecting) {
            finishRectSelection(getWidgetRects);
          }
        }}
      >

        {/* Independent Card Widget */}
        {isCardWidgetVisible && (
          <OverlayWidget
            gameMode="card_widget"
            instanceId="card_widget"
            isSelected={selectedWidgetIds.has('card_widget')}
            isPartOfMultiSelection={isMultiSelectionActive && effectiveSelectionMembers.includes('card_widget')}
            {...getGroupProps('card_widget')}
            onSelect={toggleSelect}
            onStateChange={handleWidgetStateChange}
            containerRefCallback={containerRefCallback}
            externalState={externalStates['card_widget']}
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
            gameMode="yugioh"
            instanceId="yugioh"
            isSelected={selectedWidgetIds.has('yugioh')}
            isPartOfMultiSelection={isMultiSelectionActive && effectiveSelectionMembers.includes('yugioh')}
            {...getGroupProps('yugioh')}
            onSelect={toggleSelect}
            onStateChange={handleWidgetStateChange}
            containerRefCallback={containerRefCallback}
            externalState={externalStates['yugioh']}
          >
            <div className="pointer-events-auto">
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
            gameMode="hololive_sp_marker"
            instanceId="hololive_sp_marker"
            isSelected={selectedWidgetIds.has('hololive_sp_marker')}
            isPartOfMultiSelection={isMultiSelectionActive && effectiveSelectionMembers.includes('hololive_sp_marker')}
            {...getGroupProps('hololive_sp_marker')}
            onSelect={toggleSelect}
            onStateChange={handleWidgetStateChange}
            containerRefCallback={containerRefCallback}
            externalState={externalStates['hololive_sp_marker']}
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
            gameMode="dice"
            instanceId="dice"
            isSelected={selectedWidgetIds.has('dice')}
            isPartOfMultiSelection={isMultiSelectionActive && effectiveSelectionMembers.includes('dice')}
            {...getGroupProps('dice')}
            onSelect={toggleSelect}
            onStateChange={handleWidgetStateChange}
            containerRefCallback={containerRefCallback}
            externalState={externalStates['dice']}
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
            gameMode="coin"
            instanceId="coin"
            isSelected={selectedWidgetIds.has('coin')}
            isPartOfMultiSelection={isMultiSelectionActive && effectiveSelectionMembers.includes('coin')}
            {...getGroupProps('coin')}
            onSelect={toggleSelect}
            onStateChange={handleWidgetStateChange}
            containerRefCallback={containerRefCallback}
            externalState={externalStates['coin']}
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

        {/* Rectangle Selection Overlay */}
        {isSelecting && selectionRect && (
          <div
            className="fixed pointer-events-none z-[400] border-2 border-blue-400/60 bg-blue-400/10 rounded-sm"
            style={{
              left: Math.min(selectionRect.startX, selectionRect.currentX),
              top: Math.min(selectionRect.startY, selectionRect.currentY),
              width: Math.abs(selectionRect.currentX - selectionRect.startX),
              height: Math.abs(selectionRect.currentY - selectionRect.startY),
            }}
          />
        )}
      </main>

      {/* Group Bounding Boxes */}
      {groupData.groups.map(group => {
        const activeAnchor = resolveActiveAnchor(group);
        if (!activeAnchor) return null;
        return (
          <GroupBoundingBox
            key={group.id}
            groupId={group.id}
            memberIds={group.memberIds}
            anchorId={activeAnchor}
            isSelected={selectedWidgetIds.has(group.id)}
            widgetRefsMap={widgetRefsMap}
            onAnchorStateChange={handleGroupDrag}
            onManipulationStart={handleManipulationStart}
            onUngroup={ungroupWidgets}
            externalAnchorState={externalStates[activeAnchor]}
          />
        );
      })}

      {/* Transient Selection Bounding Box (for multiple selected independent gadgets) */}
      {isMultiSelectionActive && !groupData.groups.some(g => selectedWidgetIds.has(g.id) && g.memberIds.length === effectiveSelectionMembers.length) && (
        <GroupBoundingBox
          groupId="transient-selection"
          memberIds={effectiveSelectionMembers}
          anchorId={effectiveSelectionMembers[0]}
          isSelected={true}
          widgetRefsMap={widgetRefsMap}
          onAnchorStateChange={handleTransientDrag}
          onManipulationStart={handleManipulationStart}
          onGroup={() => groupWidgets(effectiveSelectionMembers)}
          externalAnchorState={externalStates[effectiveSelectionMembers[0]]}
        />


      )}


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
            gameMode={gameMode}
            onGameModeChange={handleGameModeChange}
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
            onToggleCardWidgetVisible={setIsCardWidgetVisible}
            isDiceVisible={isDiceVisible}
            onToggleDiceVisible={setIsDiceVisible}
            isCoinVisible={isCoinVisible}
            onToggleCoinVisible={setIsCoinVisible}
            isLPVisible={isLPVisible}
            onToggleLPVisible={setIsLPVisible}
            initialLP={initialLP}
            onChangeInitialLP={setInitialLP}
            onlyShowPlayer1={onlyShowPlayer1}
            onToggleOnlyShowPlayer1={setOnlyShowPlayer1}
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
      {import.meta.env.DEV && !isSearchView && (
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
      )}
    </div >
  );
}

export default App;
