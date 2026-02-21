import { useState, useCallback, useEffect } from 'react';
import { get, set } from 'idb-keyval';

export interface LocalCard {
    id: string; // Unique ID (usually paths)
    name: string; // File name without extension
    path: string; // Relative path from root
    fullPath: string; // Full path including root
    url: string; // Object URL for rendering
    folderName: string; // The immediate parent folder name
    ocgName?: string; // Level 1 folder (if applicable)
    deckName?: string; // Level 2 folder (if applicable)
    metadata: Record<string, any>;
    yomi: string;
}

const TCG_REMOTE_DIRECTORY_KEY = 'tcg_remote_root_directory_handle';

const MAX_METADATA_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_METADATA_ENTRIES = 10000;
const MAX_STRING_LENGTH = 3000;
const MAX_ARRAY_SIZE = 200;

// Helper to sanitize any metadata value
const sanitizeMetadataValue = (val: any): any => {
    if (typeof val === 'string') {
        // Block dangerous protocols
        if (val.toLowerCase().trim().startsWith('javascript:')) {
            console.warn('Blocked potentially malicious javascript: protocol in metadata');
            return '';
        }
        // Limit string length
        return val.slice(0, MAX_STRING_LENGTH);
    }
    if (Array.isArray(val)) {
        return val.slice(0, MAX_ARRAY_SIZE).map(sanitizeMetadataValue);
    }
    if (typeof val === 'object' && val !== null) {
        const sanitized: Record<string, any> = {};
        const entries = Object.entries(val);
        // Limit number of properties in an object
        for (const [k, v] of entries.slice(0, MAX_ARRAY_SIZE)) {
            const safeKey = k.slice(0, 100).replace(/[$\.]/g, '_'); // Basic key sanitization
            sanitized[safeKey] = sanitizeMetadataValue(v);
        }
        return sanitized;
    }
    return val;
};

export const useLocalCards = () => {
    const [cards, setCards] = useState<LocalCard[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mergeSameNameCards, setMergeSameNameCards] = useState<boolean>(() => {
        return localStorage.getItem('tcg_remote_merge_cards') !== 'false';
    });
    const [metadataOrder, setMetadataOrder] = useState<Record<string, string[]>>({});
    const [folderMetadataMap, setFolderMetadataMap] = useState<Map<string, any>>(new Map());

    // Parse metadata from found json files
    const parseMetadata = async (metadataFiles: Map<string, File>): Promise<{ cards: Map<string, Record<string, any>>, folders: Map<string, any> }> => {
        const metadataMap = new Map<string, Record<string, any>>();
        const folderMetadataMap = new Map<string, any>();
        let totalEntries = 0;

        // Sort so root metadata is parsed first, then subfolders (subfolders override root)
        const sortedFiles = Array.from(metadataFiles.entries()).sort((a, b) => {
            const depthA = a[0].split('/').length;
            const depthB = b[0].split('/').length;
            return depthA - depthB;
        });

        for (const [path, file] of sortedFiles) {
            if (totalEntries >= MAX_TOTAL_METADATA_ENTRIES) {
                console.warn(`Reached maximum metadata entry limit (${MAX_TOTAL_METADATA_ENTRIES}). Skipping ${path}`);
                continue;
            }

            if (file.size > MAX_METADATA_FILE_SIZE) {
                console.warn(`Metadata file too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Skipping ${path}`);
                continue;
            }

            try {
                const text = await file.text();
                const json = JSON.parse(text);

                if (typeof json !== 'object' || json === null) continue;

                // Store as folder metadata
                const folderPath = path.replace(/\/metadata\.json$/i, '');
                folderMetadataMap.set(folderPath === 'metadata.json' ? '' : folderPath, json);

                for (const [targetPath, data] of Object.entries(json)) {
                    if (totalEntries >= MAX_TOTAL_METADATA_ENTRIES) break;

                    // Sanitize path key (remove backslashes and prevent directory traversal patterns)
                    const normalizedTargetPath = targetPath
                        .replace(/\\/g, '/')
                        .replace(/\.\.+\//g, ''); // Simple path traversal blocking

                    const existing = metadataMap.get(normalizedTargetPath) || {};
                    const sanitizedData = sanitizeMetadataValue(data);

                    metadataMap.set(normalizedTargetPath, { ...existing, ...sanitizedData });
                    totalEntries++;
                }
            } catch (e) {
                console.warn(`Failed to parse metadata file at ${path}`, e);
            }
        }
        return { cards: metadataMap, folders: folderMetadataMap };
    };

    const scanDirectory = async (handle: FileSystemDirectoryHandle) => {
        setIsScanning(true);
        setError(null);
        try {
            const foundCards: LocalCard[] = [];
            const metadataFiles = new Map<string, File>();

            const scanLevel = async (dirHandle: FileSystemDirectoryHandle, currentPath: string, depth: number) => {
                if (depth > 5) return;

                for await (const entry of (dirHandle as any).values()) {
                    const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

                    if (entry.kind === 'file') {
                        if (entry.name.toLowerCase() === 'metadata.json') {
                            const file = await entry.getFile();
                            metadataFiles.set(entryPath, file);
                        } else if (entry.name.match(/\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i)) {
                            const file = await entry.getFile();
                            const url = URL.createObjectURL(file);

                            const parts = entryPath.split('/');
                            let folderName = handle.name;
                            let ocgName = undefined;
                            let deckName = undefined;

                            if (parts.length === 2) {
                                folderName = parts[0];
                                ocgName = parts[0];
                            } else if (parts.length === 3) {
                                folderName = parts[1];
                                ocgName = parts[0];
                                deckName = parts[1];
                            }

                            foundCards.push({
                                id: `${handle.name}/${entryPath}`,
                                name: entry.name.replace(/\.[^/.]+$/, ""),
                                path: entryPath,
                                fullPath: `${handle.name}/${entryPath}`,
                                url,
                                folderName,
                                ocgName,
                                deckName,
                                metadata: {},
                                yomi: ''
                            });
                        }
                    } else if (entry.kind === 'directory') {
                        await scanLevel(entry, entryPath, depth + 1);
                    }
                }
            };

            await scanLevel(handle, '', 0);

            const { cards: metadataMap, folders: newFolderMetadataMap } = await parseMetadata(metadataFiles);

            // Extract global order info (fallback/legacy)
            const globalOrder = metadataMap.get('__order') as Record<string, string[]> | undefined;
            setMetadataOrder(globalOrder || {});
            setFolderMetadataMap(newFolderMetadataMap);

            foundCards.sort((a, b) => a.path.split('/').length - b.path.split('/').length);

            const uniqueCardsMap = new Map<string, LocalCard>();
            const enrichedCards: LocalCard[] = [];

            for (const card of foundCards) {
                const fileNameWithExt = card.path.split('/').pop() || card.name;
                let data = metadataMap.get(fileNameWithExt);

                if (!data) {
                    data = metadataMap.get(card.path) || metadataMap.get(card.name);
                }

                const enrichedCard = {
                    ...card,
                    metadata: data || {},
                    yomi: data?.yomi || ''
                };

                const isStandalone = data?.standalone === true || data?.別カード扱い === true || data?.separateCard === true;
                const shouldMerge = localStorage.getItem('tcg_remote_merge_cards') !== 'false';
                const dedupeKey = (!shouldMerge || isStandalone) ? card.path : card.name;

                if (!uniqueCardsMap.has(dedupeKey)) {
                    uniqueCardsMap.set(dedupeKey, enrichedCard);
                    enrichedCards.push(enrichedCard);
                } else if (shouldMerge && !isStandalone) {
                    const existing = uniqueCardsMap.get(dedupeKey)!;
                    const existingPriority = existing.metadata?.priority || 0;
                    const currentPriority = data?.priority || 0;

                    if (currentPriority > existingPriority) {
                        uniqueCardsMap.set(dedupeKey, enrichedCard);
                        const index = enrichedCards.findIndex(c => c.id === existing.id);
                        if (index !== -1) enrichedCards[index] = enrichedCard;
                    }
                }
            }

            cards.forEach(c => URL.revokeObjectURL(c.url));
            setCards(enrichedCards);
            setRootHandle(handle);
            setHasAccess(true);
            await set(TCG_REMOTE_DIRECTORY_KEY, handle);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error scanning directory');
            setHasAccess(false);
        } finally {
            setIsScanning(false);
        }
    };

    const requestAccess = async () => {
        try {
            if (!('showDirectoryPicker' in window)) {
                throw new Error('Your browser does not support the File System Access API. Please use a modern Chrome or Edge browser.');
            }
            const handle = await (window as any).showDirectoryPicker({
                id: 'tcg_remote_card_directory',
                mode: 'read'
            });
            await scanDirectory(handle);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError(err.message || 'Failed to select directory');
            }
        }
    };

    const reloadLastSession = useCallback(async () => {
        try {
            const handle = await get(TCG_REMOTE_DIRECTORY_KEY);
            if (handle) {
                const permission = await (handle as any).queryPermission({ mode: 'read' });
                if (permission === 'granted') {
                    await scanDirectory(handle);
                } else {
                    setRootHandle(handle);
                    setHasAccess(false);
                }
            }
        } catch (err) {
            console.log('No previous session found or permission lost');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const verifyPermissionAndScan = async () => {
        if (!rootHandle) return requestAccess();
        try {
            const permission = await (rootHandle as any).requestPermission({ mode: 'read' });
            if (permission === 'granted') {
                await scanDirectory(rootHandle);
            }
        } catch (err) {
            console.error('Permission denied', err);
            setError('Permission denied to access the folder.');
        }
    };

    useEffect(() => {
        reloadLastSession();
        return () => {
            cards.forEach(c => URL.revokeObjectURL(c.url));
        };
    }, []);

    const toggleMergeSameNameCards = (value: boolean) => {
        setMergeSameNameCards(value);
        localStorage.setItem('tcg_remote_merge_cards', String(value));
        if (rootHandle) {
            scanDirectory(rootHandle);
        }
    };

    return {
        cards,
        isScanning,
        hasAccess,
        metadataOrder,
        folderMetadataMap,
        isLoading,
        error,
        rootHandle,
        requestAccess,
        verifyPermissionAndScan,
        rescan: () => rootHandle && scanDirectory(rootHandle),
        mergeSameNameCards,
        toggleMergeSameNameCards
    };
};
