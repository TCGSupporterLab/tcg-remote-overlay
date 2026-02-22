import { useState, useEffect, useRef, useCallback } from 'react';
import { get, set, del } from 'idb-keyval';

export interface LocalCard {
    id: string;
    name: string;
    path: string;
    fullPath: string;
    url: string;
    folderName: string;
    ocgName: string;
    deckName: string;
    metadata?: Record<string, any>;
    yomi?: string;
    _linkedFrom?: string;
}

const ROOT_HANDLE_KEY = 'tcg_remote_root_handle';
const ROOT_NAME_KEY = 'tcg_remote_root_name';

const safeJsonParse = (text: string) => {
    try { return JSON.parse(text); }
    catch (e) { return null; }
};

const getInStorage = async (key: string) => {
    const val = await get(key);
    return val;
};

// Simple path helpers for browser
const getBasename = (p: string) => p.split('/').pop() || '';
const getExtStripped = (p: string) => getBasename(p).replace(/\.[^/.]+$/, "");

export const useLocalCards = () => {
    const [cards, setCards] = useState<LocalCard[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mergeSameFileCards, setMergeSameFileCards] = useState<boolean>(() => {
        return localStorage.getItem('tcg_remote_merge_cards') !== 'false';
    });
    const [savedRootName, setSavedRootName] = useState<string | null>(() => {
        return localStorage.getItem(ROOT_NAME_KEY);
    });
    const [metadataOrder, setMetadataOrder] = useState<Record<string, Record<string, string[]>>>({});
    const [folderMetadataMap, setFolderMetadataMap] = useState<Map<string, any>>(new Map());
    const scanAbortControllerRef = useRef<AbortController | null>(null);

    const loadMetadata = useCallback(async (metadataFiles: Map<string, File>) => {
        const cardMetadataMap = new Map<string, Record<string, any>>();
        const filterMetadataMap = new Map<string, Record<string, string[]>>();

        for (const [path, file] of metadataFiles) {
            const dirPath = path.substring(0, path.lastIndexOf('/'));
            const text = await file.text();
            const json = safeJsonParse(text);
            if (!json) continue;

            if (path.endsWith('_meta_filter.json')) {
                filterMetadataMap.set(dirPath, json);
            } else if (path.endsWith('_meta_card.json')) {
                Object.entries(json).forEach(([fileName, data]) => {
                    cardMetadataMap.set(`${dirPath}/${fileName}`, data as any);
                });
            }
        }
        return { cardMetadataMap, filterMetadataMap };
    }, []);

    const scanDirectory = useCallback(async (handle: FileSystemDirectoryHandle) => {
        if (scanAbortControllerRef.current) {
            scanAbortControllerRef.current.abort();
        }

        const aborter = new AbortController();
        scanAbortControllerRef.current = aborter;
        const signal = aborter.signal;

        if (import.meta.env.DEV) console.log(`[Sync] Scanning started for: ${handle.name}`);
        setIsScanning(true);
        setIsLoading(true);
        setError(null);
        setHasAccess(true);
        setRootHandle(handle);

        const foundCards: LocalCard[] = [];
        const metadataFiles = new Map<string, File>();
        const linkFiles: { ocg: string, folder: string, file: File, folderPath: string }[] = [];

        try {
            const recursiveScan = async (entry: FileSystemHandle, currentPath: string, depth: number) => {
                if (signal.aborted) return;

                if (entry.kind === 'file') {
                    const name = entry.name.toLowerCase();
                    const isImage = name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp');
                    const isJson = name.endsWith('.json');
                    const isLink = name.endsWith('.link');

                    if (isImage || isJson || isLink) {
                        const file = await (entry as any).getFile();
                        if (!file) return;

                        const parts = currentPath.split('/');
                        const ocg = parts[0];
                        const folder = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
                        const folderPath = currentPath.substring(0, Math.max(0, currentPath.lastIndexOf('/')));

                        if (isJson) {
                            metadataFiles.set(currentPath, file);
                        }
                        else if (isLink) {
                            linkFiles.push({ ocg, folder, file, folderPath });
                        }
                        else if (isImage) {
                            foundCards.push({
                                id: `${handle.name}/${currentPath}`,
                                name: getExtStripped(name),
                                path: currentPath,
                                fullPath: `${handle.name}/${currentPath}`,
                                url: URL.createObjectURL(file),
                                folderName: folder,
                                ocgName: ocg,
                                deckName: folder,
                                metadata: {},
                                yomi: ''
                            });
                        }
                    }
                }
                else if (entry.kind === 'directory') {
                    const entries = (entry as any).values();
                    for await (const childEntry of entries) {
                        if (signal.aborted) break;
                        const childPath = currentPath ? `${currentPath}/${childEntry.name}` : childEntry.name;
                        await recursiveScan(childEntry, childPath, depth + 1);
                    }
                }
            };

            await recursiveScan(handle, '', 0);

            if (signal.aborted) {
                foundCards.forEach(c => URL.revokeObjectURL(c.url));
                return;
            }

            const { cardMetadataMap, filterMetadataMap } = await loadMetadata(metadataFiles);
            if (signal.aborted) {
                foundCards.forEach(c => URL.revokeObjectURL(c.url));
                return;
            }

            // Resolve Links
            for (const linkObj of linkFiles) {
                if (signal.aborted) break;
                const text = await linkObj.file.text();
                const lines = text.split(/\r?\n/);
                for (const line of lines) {
                    const rawLine = line.trim().replace(/^['"]|['"]$/g, '').replace(/\\/g, '/');
                    if (!rawLine || !rawLine.includes('/')) continue;
                    const parts = rawLine.split('/');
                    let targetPath = '';
                    if (parts.length === 2) targetPath = `${linkObj.ocg}/${rawLine}`;
                    else if (parts.length === 3) targetPath = rawLine;
                    else continue;

                    if (targetPath.startsWith(linkObj.folderPath + '/')) continue;
                    const targetCard = foundCards.find(c => c.path === targetPath);
                    if (targetCard) {
                        foundCards.push({
                            ...targetCard,
                            id: `${handle.name}/${linkObj.folderPath}/${getBasename(targetPath)}`,
                            path: `${linkObj.folderPath}/${getBasename(targetPath)}`,
                            fullPath: `${handle.name}/${linkObj.folderPath}/${getBasename(targetPath)}`,
                            folderName: linkObj.folder,
                            ocgName: linkObj.ocg,
                            deckName: linkObj.folder,
                            _linkedFrom: targetPath
                        });
                    }
                }
            }

            if (signal.aborted) {
                foundCards.forEach(c => URL.revokeObjectURL(c.url));
                return;
            }

            const finalCards: LocalCard[] = foundCards.sort((a, b) => a.path.split('/').length - b.path.split('/').length).map(card => {
                const metaFileName = card._linkedFrom ? getBasename(card._linkedFrom) : getBasename(card.path);
                const metaOcg = card._linkedFrom ? card._linkedFrom.split('/')[0] : card.ocgName!;
                const metaKey = `${metaOcg}/${metaFileName}`;
                const data = cardMetadataMap.get(metaKey) || {};
                return { ...card, metadata: data, yomi: data.yomi || '' };
            });

            if (signal.aborted) {
                foundCards.forEach(c => URL.revokeObjectURL(c.url));
                return;
            }

            if (import.meta.env.DEV) console.log(`[Sync] Scanning finished. Found ${foundCards.length} raw cards. Status: Success`);
            setCards(prev => {
                prev.forEach(c => URL.revokeObjectURL(c.url));
                return finalCards;
            });
            setMetadataOrder(Object.fromEntries(filterMetadataMap) as Record<string, Record<string, string[]>>);
            setFolderMetadataMap(filterMetadataMap);
            localStorage.setItem(ROOT_NAME_KEY, handle.name);
            setSavedRootName(handle.name);

            setIsScanning(false);
            setIsLoading(false);
            if (import.meta.env.DEV) console.log(`[Sync] All data set and flags lowered`);

        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('Scan error:', err);
            foundCards.forEach(c => URL.revokeObjectURL(c.url));
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            if (scanAbortControllerRef.current === aborter) {
                scanAbortControllerRef.current = null;
            }
        }
    }, [loadMetadata]);

    const requestAccess = useCallback(async () => {
        try {
            const handle = await (window as any).showDirectoryPicker();
            if (!handle) return;
            await set(ROOT_HANDLE_KEY, handle);
            await scanDirectory(handle);
        } catch (err: any) {
            console.error('Directory Picker Error:', err);
            if (err.name !== 'AbortError') setError('Could not access folder.');
        }
    }, [scanDirectory]);

    const verifyPermissionAndScan = useCallback(async () => {
        try {
            setIsLoading(true);
            const handle = await getInStorage(ROOT_HANDLE_KEY);
            if (!handle) {
                setIsLoading(false);
                return;
            }
            const opts: any = { mode: 'read' };
            if (await handle.queryPermission(opts) === 'granted') {
                await scanDirectory(handle);
            } else if (await handle.requestPermission(opts) === 'granted') {
                await scanDirectory(handle);
            } else {
                setHasAccess(false);
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Permission Error:', err);
            setHasAccess(false);
            setIsLoading(false);
        }
    }, [scanDirectory]);

    const dropAccess = useCallback(async () => {
        await del(ROOT_HANDLE_KEY);
        localStorage.removeItem(ROOT_NAME_KEY);
        setCards([]);
        setHasAccess(false);
        setRootHandle(null);
        setSavedRootName(null);
    }, []);

    const toggleMergeSameFileCards = useCallback((val: boolean) => {
        setMergeSameFileCards(val);
        localStorage.setItem('tcg_remote_merge_cards', String(val));
    }, []);

    useEffect(() => {
        verifyPermissionAndScan();
    }, []);

    return {
        cards,
        isScanning,
        hasAccess,
        metadataOrder,
        folderMetadataMap,
        rootHandle,
        savedRootName,
        requestAccess,
        verifyPermissionAndScan,
        dropAccess,
        mergeSameFileCards,
        toggleMergeSameFileCards,
        isLoading,
        rescan: () => rootHandle && scanDirectory(rootHandle)
    };
};
