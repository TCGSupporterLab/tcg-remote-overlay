import { useState, useEffect, useRef, useCallback } from 'react';
import { get, set, del } from 'idb-keyval';
import * as fflate from 'fflate';

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

export const isZipFile = (file: File) => {
    return file.name.toLowerCase().endsWith('.zip') ||
        file.type === 'application/zip' ||
        file.type === 'application/x-zip-compressed' ||
        file.type === 'application/zip-compressed';
};

export interface ZipMetadata {
    fileName: string;
    fileCount: number;
    topFolders: string[];
    isSingleRoot: boolean;
    rootName: string | null;
    isAnalyzing?: boolean;
    isValid?: boolean;
    error?: string | null;
    shouldStrip?: boolean;
    filePaths?: string[]; // 追加: 正規化済みのファイルパスリスト
}

const isTargetFile = (path: string) => {
    const lower = path.toLowerCase();
    return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('/_link.txt') || path.endsWith('_link.txt');
};

export const analyzeZip = async (file: File, _onProgress?: (count: number) => void): Promise<ZipMetadata> => {
    // スキップ: ファイルをロードせずに最低限の情報を即座に返す
    return {
        fileName: file.name,
        fileCount: -1, // 枚数解析をスキップしたことを示す
        topFolders: [],
        isSingleRoot: false,
        rootName: null,
        isAnalyzing: false,
        isValid: true,
        error: null,
        shouldStrip: false
    };
};

export const useLocalCards = () => {
    const [cards, setCards] = useState<LocalCard[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isUnzipping, setIsUnzipping] = useState(false);
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
    const unzipAbortControllerRef = useRef<AbortController | null>(null);

    const cancelUnzip = useCallback(async () => {
        if (unzipAbortControllerRef.current) {
            unzipAbortControllerRef.current.abort();
            unzipAbortControllerRef.current = null;
        }
    }, []);

    const loadMetadata = useCallback(async (metadataFiles: Map<string, File>) => {
        const cardMetadataMap = new Map<string, Record<string, any>>();
        const filterMetadataMap = new Map<string, Record<string, string[]>>();

        const tasks = Array.from(metadataFiles.entries()).map(async ([path, file]) => {
            const dirPath = path.substring(0, path.lastIndexOf('/'));
            const text = await file.text();
            const json = safeJsonParse(text);
            if (!json) return;

            if (path.endsWith('_meta_filter.json')) {
                filterMetadataMap.set(dirPath, json);
            } else if (path.endsWith('_meta_card.json')) {
                const dirPrefix = dirPath ? `${dirPath}/` : '';
                const entries = Object.entries(json);
                entries.forEach(([fileName, data]) => {
                    const fullKey = `${dirPrefix}${fileName}`;
                    cardMetadataMap.set(fullKey, data as any);
                });
            }
        });

        await Promise.all(tasks);
        return { cardMetadataMap, filterMetadataMap };
    }, []);

    const processFileSystemItems = useCallback(async (
        rootName: string,
        items: { path: string, data: File | Blob }[],
        signal?: AbortSignal
    ) => {
        const filesOnly = items.filter(i => !i.path.endsWith('/'));
        if (filesOnly.length === 0) {
            throw new Error('有効なファイルが見つかりません。');
        }

        // 1. ルート省略判定 (共通ロジック)
        let stripPrefix = "";
        const allPaths = filesOnly.map(i => i.path);
        const firstEntry = allPaths[0];
        const firstPart = firstEntry.split('/')[0];
        const isSingleRoot = !!firstPart && allPaths.every(p => p.startsWith(firstPart + '/'));

        if (isSingleRoot) {
            const hasImportantFileAtL2 = allPaths.some(p => {
                const parts = p.split('/');
                return parts.length === 3 && isTargetFile(p);
            });
            if (!hasImportantFileAtL2) {
                stripPrefix = firstPart + "/";
            }
        }

        // 2. パス正規化とデータの仕分け
        const cardInputs: { cleanPath: string, data: File | Blob }[] = [];
        const metadataFiles = new Map<string, File>();
        const linkRawData: { cleanPath: string, data: string, ocg: string, folder: string, folderPath: string }[] = [];
        let hasAtLeastOneAtDepth3 = false;

        for (const item of filesOnly) {
            if (signal?.aborted) return;
            const cleanPath = item.path.startsWith(stripPrefix)
                ? item.path.substring(stripPrefix.length).replace(/^\/+/, '')
                : item.path;

            if (!cleanPath) continue;
            const parts = cleanPath.split('/').filter(Boolean);

            const isImg = isTargetFile(cleanPath) && !cleanPath.endsWith('_link.txt');
            const isJson = cleanPath.endsWith('.json');
            const isLink = cleanPath.endsWith('_link.txt');

            if (isImg || isJson || isLink) {
                // バリデーション: 画像およびリンクファイルは OCG/Deck/File (Depth >= 3) が必須
                if ((isImg || isLink) && parts.length < 3) {
                    throw new Error(`フォルダ構成が浅すぎます (${cleanPath})。「{OCG}/{デッキ}/{画像}」の構成にしてください。`);
                }

                if (isJson) {
                    const file = item.data instanceof File ? item.data : new File([item.data], parts[parts.length - 1]);
                    metadataFiles.set(cleanPath, file);
                } else if (isLink) {
                    const text = await (item.data instanceof Blob ? item.data.text() : (item.data as File).text());
                    const ocg = parts[0];
                    const folder = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
                    const folderPath = cleanPath.substring(0, Math.max(0, cleanPath.lastIndexOf('/')));
                    linkRawData.push({ cleanPath, data: text, ocg, folder, folderPath });
                    if (parts.length === 3) hasAtLeastOneAtDepth3 = true;
                } else {
                    cardInputs.push({ cleanPath, data: item.data });
                    if (parts.length === 3) hasAtLeastOneAtDepth3 = true;
                }
            }
        }

        if (!hasAtLeastOneAtDepth3 && cardInputs.length > 0) {
            throw new Error('正しいフォルダ構成（{OCG}/{デッキ}/{画像}）が見つかりません。フォルダが多重になっていないか確認してください。');
        }

        if (cardInputs.length === 0 && linkRawData.length === 0) {
            throw new Error('表示可能なカード画像が見つかりませんでした。');
        }

        // 3. カードオブジェクトの構築
        const foundCards: LocalCard[] = [];
        const pathCardMap = new Map<string, LocalCard>();

        for (const input of cardInputs) {
            if (signal?.aborted) return;
            const parts = input.cleanPath.split('/');
            const ocg = parts[0];
            const folder = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
            const rawName = parts[parts.length - 1];

            const card: LocalCard = {
                id: `${rootName}/${input.cleanPath}`,
                name: getExtStripped(rawName),
                path: input.cleanPath,
                fullPath: `${rootName}/${input.cleanPath}`,
                url: URL.createObjectURL(input.data),
                folderName: folder,
                ocgName: ocg,
                deckName: folder,
                metadata: {},
                yomi: ''
            };
            foundCards.push(card);
            pathCardMap.set(input.cleanPath, card);
        }

        // 4. メタデータ読み込み
        const { cardMetadataMap, filterMetadataMap } = await loadMetadata(metadataFiles);

        // 5. リンク解決
        for (const linkObj of linkRawData) {
            if (signal?.aborted) return;
            const lines = linkObj.data.split(/\r?\n/);
            for (const line of lines) {
                let rawLine = line.trim().replace(/^['"]|['"]$/g, '').replace(/\\/g, '/');
                if (rawLine.startsWith('/')) rawLine = rawLine.substring(1);
                if (!rawLine || !rawLine.includes('/')) continue;

                const parts = rawLine.split('/');
                let targetPath = '';
                if (parts.length === 2) targetPath = `${linkObj.ocg}/${rawLine}`;
                else if (parts.length >= 3) targetPath = rawLine;
                else continue;

                if (targetPath.startsWith(linkObj.folderPath + '/')) continue;

                const targetCard = pathCardMap.get(targetPath);
                if (targetCard) {
                    foundCards.push({
                        ...targetCard,
                        id: `${rootName}/${targetPath}-${foundCards.length}`, // ユニークID
                        path: `${linkObj.folderPath}/${getBasename(targetPath)}`,
                        fullPath: `${rootName}/${targetPath}`,
                        folderName: linkObj.folder,
                        ocgName: linkObj.ocg,
                        deckName: linkObj.folder,
                        _linkedFrom: targetPath
                    });
                }
            }
        }

        // 6. ソートとメタデータ適用
        const cardWithDepth = foundCards.map(c => ({ card: c, depth: c.path.split('/').length }));
        cardWithDepth.sort((a, b) => a.depth - b.depth);

        const finalCards: LocalCard[] = cardWithDepth.map(({ card }) => {
            const path = card.path;
            const pathParts = path.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const ocgName = pathParts[0];

            let data = cardMetadataMap.get(path);
            if (!data && pathParts.length > 2) {
                data = cardMetadataMap.get(`${ocgName}/${fileName}`);
            }
            if (!data && card._linkedFrom) {
                const linkPath = card._linkedFrom;
                const linkParts = linkPath.split('/');
                data = cardMetadataMap.get(linkPath) || cardMetadataMap.get(`${ocgName}/${linkParts[linkParts.length - 1]}`);
            }

            const finalData = data || {};
            return { ...card, metadata: finalData, yomi: finalData.yomi || '' };
        });

        // ステート更新
        setCards(prev => {
            prev.forEach(c => URL.revokeObjectURL(c.url));
            return finalCards;
        });
        setMetadataOrder(Object.fromEntries(filterMetadataMap) as Record<string, Record<string, string[]>>);
        setFolderMetadataMap(filterMetadataMap);
    }, [loadMetadata, getExtStripped]);

    const scanInProgressRef = useRef(false);
    const scanDirectory = useCallback(async (handle: FileSystemDirectoryHandle) => {
        if (scanInProgressRef.current) return;
        scanInProgressRef.current = true;

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

        const foundItems: { path: string, data: File }[] = [];

        try {
            const CONCURRENCY_LIMIT = 64;

            const recursiveScan = async (dirHandle: any, currentPath: string) => {
                if (signal.aborted) return;

                const entries = [];
                for await (const entry of dirHandle.values()) {
                    if (signal.aborted) break;
                    entries.push(entry);
                }

                const tasks: Promise<void>[] = [];
                for (const entry of entries) {
                    const childPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
                    if (entry.kind === 'directory') {
                        tasks.push(recursiveScan(entry, childPath));
                    } else if (entry.kind === 'file') {
                        tasks.push((async () => {
                            const file = await entry.getFile();
                            foundItems.push({ path: childPath, data: file });
                        })());
                    }

                    if (tasks.length >= CONCURRENCY_LIMIT) {
                        await Promise.all(tasks);
                        tasks.length = 0;
                    }
                }
                await Promise.all(tasks);
            };

            await recursiveScan(handle, '');

            if (signal.aborted) return;

            // 共通ロジックで処理
            await processFileSystemItems(handle.name, itemsMapToArr(foundItems), signal);

            localStorage.setItem(ROOT_NAME_KEY, handle.name);
            setSavedRootName(handle.name);
            setIsScanning(false);
            setIsLoading(false);

        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('Scan error:', err);
            setError(err instanceof Error ? err.message : String(err));
            setIsScanning(false);
            setIsLoading(false);
        } finally {
            if (scanAbortControllerRef.current === aborter) {
                scanAbortControllerRef.current = null;
            }
            scanInProgressRef.current = false;
        }
    }, [processFileSystemItems]);

    // Helper to match the interface
    const itemsMapToArr = (items: { path: string, data: File | Blob }[]) => items;

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

    const unzipInProgressRef = useRef(false);
    const unzipAndSave = useCallback(async (zipFile: File) => {
        if (unzipInProgressRef.current) {
            console.warn('[ZIP] Unzip already in progress, skipping...');
            return;
        }

        if (!isZipFile(zipFile)) {
            setError('ZIPファイルではありません。');
            return;
        }

        unzipInProgressRef.current = true;
        unzipAbortControllerRef.current = new AbortController();
        const signal = unzipAbortControllerRef.current.signal;

        setIsScanning(true);
        setIsLoading(true);
        let extractionRoot: FileSystemDirectoryHandle | null = null;
        let zipBaseName = '';

        try {
            setError(null);

            if (import.meta.env.DEV) console.log('[ZIP] Opening directory picker...');
            try {
                extractionRoot = await (window as any).showDirectoryPicker({
                    mode: 'readwrite',
                    startIn: 'pictures'
                });
            } catch (e: any) {
                if (e.name === 'AbortError') {
                    if (import.meta.env.DEV) console.log('[ZIP] Picker aborted by user');
                    setIsScanning(false);
                    setIsLoading(false);
                    setIsUnzipping(false);
                    unzipInProgressRef.current = false;
                    return;
                }
                throw e;
            }

            if (!extractionRoot) throw new Error('フォルダが選択されませんでした。');

            // フォルダが選択されたこのタイミングでオーバーレイを表示
            setIsUnzipping(true);

            // 1. ZIPファイル名（拡張子なし）のサブフォルダを作成
            zipBaseName = getExtStripped(zipFile.name).replace(/[<>:"/\\|?*]/g, '_');
            const targetParentHandle = await extractionRoot.getDirectoryHandle(zipBaseName, { create: true });

            if (import.meta.env.DEV) console.log(`[ZIP] Created target subdirectory: ${targetParentHandle.name}`);

            if (import.meta.env.DEV) console.log('[ZIP] Reading ZIP file data...');
            const arrayBuffer = await zipFile.arrayBuffer();
            const zipData = new Uint8Array(arrayBuffer);
            if (import.meta.env.DEV) console.log(`[ZIP] ZIP data loaded (${zipData.length} bytes)`);

            await new Promise<void>((resolve, reject) => {
                fflate.unzip(zipData, async (err, unzipped) => {
                    if (err) {
                        reject(new Error(`ZIPの解析に失敗しました: ${err.message}`));
                        return;
                    }

                    try {
                        const dirCache = new Map<string, Promise<FileSystemDirectoryHandle>>();
                        dirCache.set('', Promise.resolve(targetParentHandle));

                        const allPaths = Object.keys(unzipped).map(p => p.replace(/\\/g, '/').replace(/\/+/g, '/'));
                        const writeTasks = allPaths.filter(p => !p.endsWith('/'));
                        if (writeTasks.length === 0) {
                            resolve();
                            return;
                        }

                        const getDirHandleCached = (dirParts: string[]): Promise<FileSystemDirectoryHandle> => {
                            let currentPath = '';
                            let currentPromise = dirCache.get('')!;

                            for (const part of dirParts) {
                                const parentPath = currentPath;
                                const sanitizedPart = part.replace(/[<>:"/\\|?*]/g, '_');
                                currentPath += (currentPath ? '/' : '') + sanitizedPart;

                                if (!dirCache.has(currentPath)) {
                                    const parentDirPromise = dirCache.get(parentPath)!;
                                    dirCache.set(currentPath, (async () => {
                                        const parentDir = await parentDirPromise;
                                        return await parentDir.getDirectoryHandle(sanitizedPart, { create: true });
                                    })());
                                }
                                currentPromise = dirCache.get(currentPath)!;
                            }
                            return currentPromise;
                        };

                        let processedCount = 0;
                        const foundItems: { path: string, data: Blob }[] = [];

                        const processFile = async (pathOnly: string) => {
                            if (signal.aborted) throw new Error('ABORT');

                            const data = unzipped[pathOnly];
                            const blob = new Blob([data as any]);
                            foundItems.push({ path: pathOnly, data: blob });

                            // ディスクへの書き込み
                            const parts = pathOnly.split('/').map(p => p.trim()).filter(Boolean);
                            const dirParts = parts.slice(0, -1);
                            const fileName = parts[parts.length - 1].replace(/[<>:"/\\|?*]/g, '_');

                            try {
                                const dirHandle = await getDirHandleCached(dirParts);
                                const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
                                const writable = await fileHandle.createWritable();
                                await writable.write(data as any);
                                await writable.close();

                                processedCount++;
                                if (import.meta.env.DEV && processedCount % 100 === 0) {
                                    console.log(`[ZIP] Writing file ${processedCount}/${writeTasks.length}: ${fileName}`);
                                }
                            } catch (e) {
                                console.error(`[ZIP] Failed to write file "${fileName}":`, e);
                                throw e;
                            }
                        };

                        // 並列書き込み
                        const CONCURRENCY = 24;
                        let taskIndex = 0;
                        const worker = async () => {
                            while (taskIndex < writeTasks.length) {
                                if (signal.aborted) break;
                                const task = writeTasks[taskIndex++];
                                await processFile(task);
                            }
                        };
                        await Promise.all(Array(Math.min(CONCURRENCY, writeTasks.length)).fill(null).map(worker));

                        if (signal.aborted) throw new Error('ABORT');

                        if (import.meta.env.DEV) console.log(`[ZIP] Extraction complete. Total files: ${processedCount}. Determining optimal root...`);

                        // --- 物理的な接続ルートの決定ロジック ---
                        // 1. ルート省略判定ロジックを流用して、物理的な共通接頭辞を特定
                        let stripPrefixParts: string[] = [];
                        const filesOnlyPaths = foundItems.map(i => i.path);
                        const firstEntry = filesOnlyPaths[0];
                        const firstPart = firstEntry.split('/')[0];
                        const isSingleRootInZip = !!firstPart && filesOnlyPaths.every(p => p.startsWith(firstPart + '/'));

                        if (isSingleRootInZip) {
                            const hasImportantFileAtL2 = filesOnlyPaths.some(p => {
                                const parts = p.split('/');
                                return parts.length === 3 && isTargetFile(p);
                            });
                            if (!hasImportantFileAtL2) {
                                stripPrefixParts = [firstPart];
                            }
                        }

                        // 2. 確定したパスの DirectoryHandle を取得する
                        let finalRootHandle = targetParentHandle;
                        for (const part of stripPrefixParts) {
                            try {
                                finalRootHandle = await finalRootHandle.getDirectoryHandle(part);
                            } catch (e) {
                                console.warn(`[ZIP] Failed to enter subfolder "${part}" for root sync, staying at parent.`, e);
                                break;
                            }
                        }

                        if (import.meta.env.DEV) console.log(`[ZIP] Connected to optimal root: ${finalRootHandle.name}`);

                        // 3. 共通ロジックでメモリ上のカードリスト化
                        await processFileSystemItems(finalRootHandle.name, itemsMapToArr(foundItems));

                        // 4. インデックスDBとステートに保存
                        await set(ROOT_HANDLE_KEY, finalRootHandle);
                        localStorage.setItem(ROOT_NAME_KEY, finalRootHandle.name);

                        setSavedRootName(finalRootHandle.name);
                        setRootHandle(finalRootHandle);
                        setHasAccess(true);
                        setIsLoading(false);
                        setIsScanning(false);
                        setIsUnzipping(false);
                        resolve();

                    } catch (innerErr: any) {
                        console.error('Inner ZIP Processing Error:', innerErr);
                        reject(innerErr);
                    }
                });
            });

        } catch (err: any) {
            console.error('ZIP Process Error:', err);

            if (err.message === 'ABORT') {
                if (import.meta.env.DEV) console.log('[ZIP] Extraction aborted by user. Cleaning up...');
                if (extractionRoot && zipBaseName) {
                    try {
                        await extractionRoot.removeEntry(zipBaseName, { recursive: true });
                        if (import.meta.env.DEV) console.log(`[ZIP] Cleaned up aborted directory: ${zipBaseName}`);
                    } catch (deleteErr) {
                        console.error('[ZIP] Failed to cleanup aborted directory:', deleteErr);
                    }
                }
                setIsScanning(false);
                setIsLoading(false);
                setIsUnzipping(false);
                return;
            }

            // 構成エラー等の場合、作成されたばかりのフォルダの削除を提案する
            if (extractionRoot && zipBaseName && err.name !== 'AbortError') {
                const message = `構成エラー: ${err.message}\n\n展開されたフォルダ「${zipBaseName}」の構成が正しくないため、ツールで認識できませんでした。このフォルダを削除しますか？`;
                if (window.confirm(message)) {
                    try {
                        await extractionRoot.removeEntry(zipBaseName, { recursive: true });
                        if (import.meta.env.DEV) console.log(`[ZIP] Cleaned up invalid directory: ${zipBaseName}`);
                    } catch (deleteErr) {
                        console.error('[ZIP] Failed to delete invalid directory:', deleteErr);
                    }
                }
            }

            setError(`ZIP展開中にエラーが発生しました: ${err.message}`);
            setIsScanning(false);
            setIsLoading(false);
            setIsUnzipping(false);
        } finally {
            unzipInProgressRef.current = false;
            unzipAbortControllerRef.current = null;
        }
    }, [processFileSystemItems]);

    const toggleMergeSameFileCards = useCallback((val: boolean) => {
        setMergeSameFileCards(val);
        localStorage.setItem('tcg_remote_merge_cards', String(val));
    }, []);

    const initialScanRef = useRef(false);
    useEffect(() => {
        if (initialScanRef.current) return;
        initialScanRef.current = true;
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
        unzipAndSave,
        isUnzipping,
        cancelUnzip,
        analyzeZip,
        mergeSameFileCards,
        toggleMergeSameFileCards,
        isLoading,
        error,
        scanDirectory,
        rescan: () => rootHandle && scanDirectory(rootHandle)
    };
};
