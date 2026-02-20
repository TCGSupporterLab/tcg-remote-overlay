import { useEffect, useState, useCallback } from 'react';

// Define the shape of our shared state
export type SharedState = {
    gameMode: 'yugioh' | 'hololive';
    yugioh: {
        p1: { life: number; log: number[] };
        p2: { life: number; log: number[] };
    };
    toolResult: {
        type: 'dice' | 'coin' | 'none';
        value: string | number | null;
        visible: boolean;
    };
    ocrResult: string;
};

const CHANNEL_NAME = 'tcg_remote_sync';

export const useSharedState = (initialState: SharedState) => {
    const [state, setState] = useState<SharedState>(initialState);
    const [isOverlay, setIsOverlay] = useState(false);

    // Check if we are in overlay mode (via URL query param)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setIsOverlay(params.get('mode') === 'overlay');
    }, []);

    // Sync logic
    useEffect(() => {
        const channel = new BroadcastChannel(CHANNEL_NAME);

        // Listen for updates
        channel.onmessage = (event) => {
            if (event.data && typeof event.data === 'object') {
                setState(prev => ({ ...prev, ...event.data }));
            }
        };

        return () => {
            channel.close();
        };
    }, []);

    // Function to broadcast updates
    const updateState = useCallback((updates: Partial<SharedState>) => {
        setState(prev => {
            const newState = { ...prev, ...updates };
            // Broadcast the change to other windows
            const channel = new BroadcastChannel(CHANNEL_NAME);
            channel.postMessage(updates);
            channel.close();
            return newState;
        });
    }, []);

    return { state, updateState, isOverlay };
};
