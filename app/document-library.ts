export const LIBRARY_FILE_TYPES = [
  "PDF",
  "DOCX",
  "DOC",
  "JPG",
  "PNG",
  "JPEG",
  "XLSX",
] as const;

export type LibraryFileType = (typeof LIBRARY_FILE_TYPES)[number];

export type LibraryFile = {
  id: string;
  name: string;
  type: LibraryFileType;
  size: number;
  createdAt: string;
  updatedAt: string;
  blob: Blob;
};

const DB_NAME = "ai-application-planner-files";
const DB_VERSION = 1;
const STORE = "documents";
const CHANGE_CHANNEL = "ai-application-planner-files";

function notifyLibraryChange() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANGE_CHANNEL);
  channel.postMessage({ type: "change" });
  channel.close();
}

export function subscribeLibraryChanges(listener: () => void) {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(CHANGE_CHANNEL);
  channel.onmessage = () => listener();
  return () => channel.close();
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function libraryFileType(fileName: string): LibraryFileType | null {
  const extension = fileName.split(".").pop()?.toUpperCase();
  if (!extension) return null;
  return LIBRARY_FILE_TYPES.find((type) => type === extension) ?? null;
}

export async function listLibraryFiles() {
  const db = await openDatabase();
  try {
    const files = await requestToPromise(
      db.transaction(STORE, "readonly").objectStore(STORE).getAll(),
    );
    return (files as LibraryFile[]).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  } finally {
    db.close();
  }
}

export async function addLibraryFile(file: File) {
  const type = libraryFileType(file.name);
  if (!type) return null;

  const now = new Date().toISOString();
  const record: LibraryFile = {
    id: crypto.randomUUID(),
    name: file.name,
    type,
    size: file.size,
    createdAt: now,
    updatedAt: now,
    blob: file,
  };

  const db = await openDatabase();
  try {
    await requestToPromise(
      db.transaction(STORE, "readwrite").objectStore(STORE).put(record),
    );
    return record;
  } finally {
    db.close();
  }
}

export async function renameLibraryFile(id: string, name: string) {
  const db = await openDatabase();
  try {
    const current = (await requestToPromise(
      db.transaction(STORE, "readonly").objectStore(STORE).get(id),
    )) as LibraryFile | undefined;
    if (!current) return;
    current.name = name;
    current.updatedAt = new Date().toISOString();
    await requestToPromise(
      db.transaction(STORE, "readwrite").objectStore(STORE).put(current),
    );
    notifyLibraryChange();
  } finally {
    db.close();
  }
}

export async function getLibraryFile(id: string) {
  const db = await openDatabase();
  try {
    return (await requestToPromise(
      db.transaction(STORE, "readonly").objectStore(STORE).get(id),
    )) as LibraryFile | undefined;
  } finally {
    db.close();
  }
}

export function openLibraryFile(file: LibraryFile) {
  const url = URL.createObjectURL(file.blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadLibraryFile(file: LibraryFile) {
  const url = URL.createObjectURL(file.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function deleteLibraryFile(id: string) {
  const db = await openDatabase();
  try {
    await requestToPromise(
      db.transaction(STORE, "readwrite").objectStore(STORE).delete(id),
    );
    notifyLibraryChange();
  } finally {
    db.close();
  }
}
