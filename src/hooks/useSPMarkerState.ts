import { useState, useEffect, useCallback } from 'react';

type SPMarkerFace = 'front' | 'back';

interface SPMarkerState {
    isVisible: boolean;
    face: SPMarkerFace;
    isForceHidden: boolean;
}

const STORAGE_KEY = 'tcg_remote_sp_marker_state_v4';
const CHANNEL_NAME = 'tcg_remote_sp_marker_sync';

const DEFAULT_STATE: SPMarkerState = {
    isVisible: false,
    face: 'front',
    isForceHidden: false
};

export const useSPMarkerState = () => {
    const [state, setState] = useState<SPMarkerState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return { ...DEFAULT_STATE, ...parsed, isForceHidden: false };
        }
        return DEFAULT_STATE;
    });

    const updateState = useCallback((patch: Partial<SPMarkerState>) => {
        setState(prev => {
            const next = { ...prev, ...patch };

            // Persist everything EXCEPT isForceHidden
            const { isForceHidden, ...persistentState } = next;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentState));

            const channel = new BroadcastChannel(CHANNEL_NAME);
            channel.postMessage(next);
            channel.close();

            return next;
        });
    }, []);

    useEffect(() => {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = (event) => {
            setState(event.data);
        };
        return () => channel.close();
    }, []);

    const toggleVisible = useCallback(() => updateState({ isVisible: !state.isVisible }), [state.isVisible, updateState]);
    const toggleFace = useCallback(() => updateState({ face: state.face === 'front' ? 'back' : 'front' }), [state.face, updateState]);
    const toggleForceHidden = useCallback(() => updateState({ isForceHidden: !state.isForceHidden }), [state.isForceHidden, updateState]);

    return {
        isSPMarkerVisible: state.isVisible,
        spMarkerFace: state.face,
        showSPMarkerForceHidden: state.isForceHidden,
        toggleSPMarkerMode: toggleVisible,
        toggleSPMarkerFace: toggleFace,
        toggleSPMarkerForceHidden: toggleForceHidden,
        setSPMarkerVisible: (val: boolean) => updateState({ isVisible: val }),
    };
};
