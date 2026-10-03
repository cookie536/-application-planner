"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type CommonDocumentVersion = {
  id: string;
  fileName: string;
  date: string;
  note?: string;
};

export type CommonDocument = {
  id: string;
  name: string;
  category: string;
  note?: string;
  uploadDate?: string;
  versions: CommonDocumentVersion[];
};

export const DOCUMENT_CATEGORIES = [
  "成绩单",
  "语言成绩",
  "身份证明",
  "证书",
  "其他",
] as const;

const COMMON_DOCUMENTS_STORAGE_KEY =
  "ai-application-planner:common-documents:v2";
const LEGACY_COMMON_DOCUMENTS_STORAGE_KEY =
  "ai-application-planner:common-documents";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export { createId as createCommonDocumentId };

export const initialDocuments: CommonDocument[] = [];

function readStoredDocuments(): CommonDocument[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COMMON_DOCUMENTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CommonDocument[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

type CommonDocumentsContextValue = {
  documents: CommonDocument[];
  hasHydrated: boolean;
  getDocument: (documentId: string) => CommonDocument | undefined;
  getDocumentVersion: (
    documentId: string,
    versionId: string,
  ) =>
    | { document: CommonDocument; version: CommonDocumentVersion }
    | undefined;
  addDocument: (
    input: Omit<CommonDocument, "id" | "versions"> & {
      versions?: CommonDocumentVersion[];
    },
  ) => string;
  updateDocument: (
    documentId: string,
    updates: Partial<
      Pick<CommonDocument, "name" | "category" | "note" | "uploadDate">
    >,
  ) => void;
  deleteDocument: (documentId: string) => void;
  addDocumentVersion: (
    documentId: string,
    version: Omit<CommonDocumentVersion, "id">,
  ) => void;
};

const CommonDocumentsContext =
  createContext<CommonDocumentsContextValue | null>(null);

export function CommonDocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<CommonDocument[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const persistReady = useRef(false);

  useEffect(() => {
    window.localStorage.removeItem(LEGACY_COMMON_DOCUMENTS_STORAGE_KEY);
    const stored = readStoredDocuments();
    if (stored) setDocuments(stored);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!persistReady.current) {
      persistReady.current = true;
      return;
    }
    window.localStorage.setItem(
      COMMON_DOCUMENTS_STORAGE_KEY,
      JSON.stringify(documents),
    );
  }, [documents, hasHydrated]);

  const getDocument = useCallback(
    (documentId: string) => documents.find((doc) => doc.id === documentId),
    [documents],
  );

  const getDocumentVersion = useCallback(
    (documentId: string, versionId: string) => {
      const document = documents.find((doc) => doc.id === documentId);
      if (!document) return undefined;
      const version = document.versions.find((item) => item.id === versionId);
      if (!version) return undefined;
      return { document, version };
    },
    [documents],
  );

  const addDocument = useCallback(
    (
      input: Omit<CommonDocument, "id" | "versions"> & {
        versions?: CommonDocumentVersion[];
      },
    ) => {
      const id = createId("doc");
      setDocuments((prev) => [
        {
          id,
          name: input.name,
          category: input.category,
          note: input.note,
          uploadDate: input.uploadDate,
          versions: input.versions ?? [],
        },
        ...prev,
      ]);
      return id;
    },
    [],
  );

  const updateDocument = useCallback(
    (
      documentId: string,
      updates: Partial<
        Pick<CommonDocument, "name" | "category" | "note" | "uploadDate">
      >,
    ) => {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                ...updates,
              }
            : doc,
        ),
      );
    },
    [],
  );

  const deleteDocument = useCallback((documentId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  }, []);

  const addDocumentVersion = useCallback(
    (documentId: string, version: Omit<CommonDocumentVersion, "id">) => {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id !== documentId
            ? doc
            : {
                ...doc,
                uploadDate: version.date,
                versions: [
                  {
                    id: createId("docver"),
                    ...version,
                  },
                  ...doc.versions,
                ],
              },
        ),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      documents,
      hasHydrated,
      getDocument,
      getDocumentVersion,
      addDocument,
      updateDocument,
      deleteDocument,
      addDocumentVersion,
    }),
    [
      documents,
      hasHydrated,
      getDocument,
      getDocumentVersion,
      addDocument,
      updateDocument,
      deleteDocument,
      addDocumentVersion,
    ],
  );

  return (
    <CommonDocumentsContext.Provider value={value}>
      {children}
    </CommonDocumentsContext.Provider>
  );
}

export function useCommonDocuments() {
  const context = useContext(CommonDocumentsContext);
  if (!context) {
    throw new Error(
      "useCommonDocuments must be used within CommonDocumentsProvider",
    );
  }
  return context;
}
