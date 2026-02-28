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
}

export const analyzeZip = async (file: File): Promise<ZipMetadata> => {
    const arrayBuffer = await file.arrayBuffer();
    const zipData = new Uint8Array(arrayBuffer);

    return new Promise((resolve, reject) => {
        fflate.unzip(zipData, (err, unzipped) => {
            if (err) return reject(new Error(`ZIPの解析に失敗しました: ${err.message}`));

            // パスを正規化（Windows形式の \ も / に統一）
            const allPaths = Object.keys(unzipped).map(p => p.replace(/\\/g, '/'));
            const files = allPaths.filter(p => !p.endsWith('/'));

            // 単一ルートの判定
            const firstEntry = files[0];
            const firstPart = firstEntry ? firstEntry.split('/')[0] : null;
            const isSingleRoot = !!firstPart && files.every(p => p.startsWith(firstPart + '/'));

            const folders = new Set<string>();
            allPaths.forEach(p => {
                const parts = p.split('/').filter(Boolean);

                // フォルダ名を抽出
                if (isSingleRoot) {
                    // Root/SubFolder/... の SubFolder を取り出す
                    if (parts.length >= 2) {
                        // ファイル名（最後の要素）ではないことを確認（フォルダエントリか、さらに下の階層がある場合）
                        if (p.endsWith('/') || parts.length > 2) {
                            folders.add(parts[1]);
                        }
                    }
                } else {
                    // SubFolder/... の SubFolder を取り出す
                    if (parts.length >= 1) {
                        if (p.endsWith('/') || parts.length > 1) {
                            folders.add(parts[0]);
                        }
                    }
                }
            });

            resolve({
                fileName: file.name,
                fileCount: files.length,
                topFolders: Array.from(folders).slice(0, 10),
                isSingleRoot,
                rootName: isSingleRoot ? firstPart : null
            });
        });
    });
};

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
                const dirPrefix = dirPath ? `${dirPath}/` : '';
                const entries = Object.entries(json);
                if (import.meta.env.DEV) {
                    console.log(`[Sync] Loading ${path}: Found ${entries.length} entries. DirPrefix: "${dirPrefix}"`);
                }
                entries.forEach(([fileName, data]) => {
                    const fullKey = `${dirPrefix}${fileName}`;
                    cardMetadataMap.set(fullKey, data as any);

                    // 特定のカードが登録されたかチェック
                    if (import.meta.env.DEV && (fullKey.includes('hBD24-001') || fullKey.includes('korone'))) {
                        console.log(`[Sync] Registered metaKey: "${fullKey}"`);
                    }
                });
            }
        }
        return { cardMetadataMap, filterMetadataMap };
    }, []);

    const scanInProgressRef = useRef(false);
    const scanDirectory = useCallback(async (handle: FileSystemDirectoryHandle) => {
        // 多重実行防止ガード
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

        const foundCards: LocalCard[] = [];
        const metadataFiles = new Map<string, File>();
        const linkFiles: { ocg: string, folder: string, file: File, folderPath: string }[] = [];

        try {
            const recursiveScan = async (entry: FileSystemHandle, currentPath: string, depth: number) => {
                if (signal.aborted) return;

                if (entry.kind === 'file') {
                    const rawName = entry.name;
                    const lowerName = rawName.toLowerCase();
                    const isImage = lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.webp');
                    const isJson = lowerName.endsWith('.json');
                    const isLink = lowerName === '_link.txt';

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
                                name: getExtStripped(rawName),
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
                    let rawLine = line.trim().replace(/^['"]|['"]$/g, '').replace(/\\/g, '/');
                    if (rawLine.startsWith('/')) rawLine = rawLine.substring(1);
                    if (!rawLine || !rawLine.includes('/')) continue;

                    const parts = rawLine.split('/');
                    let targetPath = '';
                    if (parts.length === 2) targetPath = `${linkObj.ocg}/${rawLine}`;
                    else if (parts.length >= 3) targetPath = rawLine;
                    else continue;

                    if (targetPath.startsWith(linkObj.folderPath + '/')) continue;

                    // ターゲットカードを完全一致で検索
                    const targetCard = foundCards.find(c => c.path === targetPath);

                    if (targetCard) {
                        foundCards.push({
                            ...targetCard,
                            id: `${handle.name}/${targetPath}`,
                            path: `${linkObj.folderPath}/${getBasename(targetPath)}`,
                            fullPath: `${handle.name}/${targetPath}`,
                            folderName: linkObj.folder,
                            ocgName: linkObj.ocg,
                            deckName: linkObj.folder,
                            _linkedFrom: targetPath
                        });
                    } else {
                        if (import.meta.env.DEV) console.warn(`[Sync] Link target not found: ${targetPath} (linked from ${linkObj.folderPath}/_link.txt)`);
                    }
                }
            }

            if (signal.aborted) {
                foundCards.forEach(c => URL.revokeObjectURL(c.url));
                return;
            }

            const finalCards: LocalCard[] = foundCards.sort((a, b) => a.path.split('/').length - b.path.split('/').length).map(card => {
                const path = card.path;
                const pathParts = path.split('/');
                const fileName = pathParts[pathParts.length - 1];
                const ocgName = pathParts[0];

                // 1. まずはフルパスの実測ケースで照合
                let data = cardMetadataMap.get(path);

                // 2. 失敗した場合、OCG直下のファイル名としてフォールバック (all/, test/ などの階層を無視)
                if (!data && pathParts.length > 2) {
                    const fallbackKey = `${ocgName}/${fileName}`;
                    data = cardMetadataMap.get(fallbackKey);
                }

                // 3. リンク元のパスでも同様に試行
                if (!data && card._linkedFrom) {
                    const linkPath = card._linkedFrom;
                    const linkParts = linkPath.split('/');
                    const linkFileName = linkParts[linkParts.length - 1];
                    data = cardMetadataMap.get(linkPath) || cardMetadataMap.get(`${ocgName}/${linkFileName}`);
                }

                const finalData = data || {};

                if (import.meta.env.DEV && (path.includes('hBD24-001') || path.includes('korone'))) {
                    console.log(`[Sync] Mapping for ${card.path}: found=${!!data}, metaKey="${ocgName}/${fileName}"`);
                }

                return { ...card, metadata: finalData, yomi: finalData.yomi || '' };
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
            setIsScanning(false);
            setIsLoading(false);
        } finally {
            if (scanAbortControllerRef.current === aborter) {
                scanAbortControllerRef.current = null;
            }
            scanInProgressRef.current = false;
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

        try {
            setIsScanning(true);
            setIsLoading(true);
            setError(null);

            // 1. 展開先フォルダの選択
            if (import.meta.env.DEV) console.log('[ZIP] Opening directory picker...');
            let targetHandle: FileSystemDirectoryHandle;
            try {
                targetHandle = await (window as any).showDirectoryPicker({
                    mode: 'readwrite',
                    startIn: 'pictures'
                });
            } catch (e: any) {
                if (e.name === 'AbortError') {
                    if (import.meta.env.DEV) console.log('[ZIP] Picker aborted by user');
                    setIsScanning(false);
                    setIsLoading(false);
                    unzipInProgressRef.current = false;
                    return;
                }
                throw e;
            }

            if (!targetHandle) throw new Error('フォルダが選択されませんでした。');
            if (import.meta.env.DEV) console.log(`[ZIP] Target directory picked: ${targetHandle.name}`);

            // ZIP名に基づいたサブフォルダの作成
            // Windowsで禁止されている文字を除去
            const zipBaseName = zipFile.name.replace(/\.[^/.]+$/, "").replace(/[<>:"/\\|?*]/g, '_').trim() || 'unzipped_cards';
            if (import.meta.env.DEV) console.log(`[ZIP] Creating extraction root: "${zipBaseName}"`);

            let extractionRoot: FileSystemDirectoryHandle;
            try {
                extractionRoot = await targetHandle.getDirectoryHandle(zipBaseName, { create: true });
            } catch (e: any) {
                console.error(`[ZIP] Failed to create root directory "${zipBaseName}":`, e);
                throw e;
            }

            // 2. ZIPデータの取得
            if (import.meta.env.DEV) console.log('[ZIP] Reading ZIP file data...');
            const arrayBuffer = await zipFile.arrayBuffer();
            const zipData = new Uint8Array(arrayBuffer);
            if (import.meta.env.DEV) console.log(`[ZIP] ZIP data loaded (${zipData.length} bytes)`);

            // 3. 展開 (fflate.unzip はコールバック版を使用)
            await new Promise<void>((resolve, reject) => {
                fflate.unzip(zipData, async (err, unzipped) => {
                    if (err) {
                        reject(new Error(`ZIPの解析に失敗しました: ${err.message}`));
                        return;
                    }

                    try {
                        // パスを正規化（Windows形式の \ も / に統一し、重複する / も削除）
                        const rawPaths = Object.keys(unzipped);
                        const filePaths = rawPaths.map(p => p.replace(/\\/g, '/').replace(/\/+/g, '/'));

                        // マッピング用
                        const pathMap = new Map<string, string>();
                        rawPaths.forEach((rp, i) => pathMap.set(filePaths[i], rp));

                        if (filePaths.length === 0) {
                            reject(new Error('ZIPファイルが空です。'));
                            return;
                        }

                        // 4. 階層構造の自動調整 (1段階の共通ルートフォルダをスキップするか判定)
                        const entries = filePaths.filter(p => !p.endsWith('/'));
                        if (entries.length === 0) {
                            reject(new Error('ZIP内にファイルが見つかりません。'));
                            return;
                        }

                        const firstEntry = entries[0];
                        const firstPart = firstEntry.split('/')[0];
                        // 全てのファイルが共通のトップフォルダ配下にあるか？
                        const allFilesInSameFolder = firstPart && entries.every(p => p.startsWith(firstPart + '/'));
                        const prefixLength = allFilesInSameFolder ? firstPart.length + 1 : 0;

                        // 5. 展開先への書き込み
                        let processedCount = 0;
                        for (const cleanPathFull of filePaths) {
                            // フォルダエントリ自体はスキップ（ファイル作成時に getDirectoryHandle で自動作成されるため）
                            if (cleanPathFull.endsWith('/')) continue;

                            // 共通ルートの除去と先頭スラッシュのトリム
                            const cleanPath = cleanPathFull.substring(prefixLength).replace(/^\/+/, '');
                            if (!cleanPath) continue;

                            // セキュリティチェックと不適切なパスの除外
                            if (cleanPath.includes('..')) continue;

                            const originalPath = pathMap.get(cleanPathFull)!;
                            const data = unzipped[originalPath];

                            // パスを要素ごとに分解し、"." や空文字を除去
                            const parts = cleanPath.split('/').map(p => p.trim()).filter(p => p && p !== '.');
                            if (parts.length === 0) continue;

                            let currentDir = extractionRoot;

                            // ディレクトリの再帰的作成（最後の要素はファイル名なので除外）
                            for (let i = 0; i < parts.length - 1; i++) {
                                let dirName = parts[i];
                                // Windows禁止文字のサニタイズ
                                dirName = dirName.replace(/[<>:"/\\|?*]/g, '_');

                                try {
                                    currentDir = await currentDir.getDirectoryHandle(dirName, { create: true });
                                } catch (e) {
                                    console.error(`[ZIP] Failed to create directory "${dirName}" in path "${cleanPath}":`, e);
                                    throw e;
                                }
                            }

                            // ファイルの書き込み
                            let fileName = parts[parts.length - 1];
                            // Windows禁止文字のサニタイズ
                            fileName = fileName.replace(/[<>:"/\\|?*]/g, '_');

                            try {
                                if (import.meta.env.DEV && processedCount % 50 === 0) {
                                    console.log(`[ZIP] Writing file ${processedCount}/${entries.length}: ${fileName}`);
                                }
                                const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
                                const writable = await fileHandle.createWritable();
                                await writable.write(data as any);
                                await writable.close();
                                processedCount++;
                            } catch (e) {
                                console.error(`[ZIP] Failed to write file "${fileName}" in path "${cleanPath}":`, e);
                                throw e;
                            }
                        }
                        if (import.meta.env.DEV) console.log(`[ZIP] Extraction complete. Total files: ${processedCount}`);

                        // 6. 完了後のスキャンと状態更新
                        // インデックスDBに保存
                        await set(ROOT_HANDLE_KEY, extractionRoot);
                        localStorage.setItem(ROOT_NAME_KEY, extractionRoot.name);

                        // ステート更新
                        setSavedRootName(extractionRoot.name);
                        setHasAccess(true);
                        setIsLoading(true);

                        // 重要: 既存のスキャンを確実にキャンセルし、新規展開先でスキャン開始
                        if (scanAbortControllerRef.current) {
                            scanAbortControllerRef.current.abort();
                        }

                        // cardsステートをクリアしてスキャン開始（新旧カードの混同防止）
                        setCards([]);
                        await scanDirectory(extractionRoot);

                        resolve();
                    } catch (innerErr: any) {
                        console.error('Inner ZIP Processing Error:', innerErr);
                        reject(innerErr);
                    }
                });
            });

        } catch (err: any) {
            console.error('ZIP Process Error:', err);
            setError(`ZIP展開中にエラーが発生しました: ${err.message}`);
            setIsScanning(false);
            setIsLoading(false);
        } finally {
            unzipInProgressRef.current = false;
        }
    }, [scanDirectory]);

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
        analyzeZip,
        mergeSameFileCards,
        toggleMergeSameFileCards,
        isLoading,
        error,
        scanDirectory,
        rescan: () => rootHandle && scanDirectory(rootHandle)
    };
};
