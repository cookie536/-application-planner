"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  "Transcript",
  "Language Test",
  "Identity",
  "Certificate",
  "Other",
] as const;

const COMMON_DOCUMENTS_STORAGE_KEY = "ai-application-planner:common-documents";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export { createId as createCommonDocumentId };

export const initialDocuments: CommonDocument[] = [
  {
    id: "doc-transcript",
    name: "Transcript",
    category: "Transcript",
    note: "Official academic transcript for all applications.",
    uploadDate: "2026-03-12",
    versions: [
      {
        id: "doc-transcript-v1",
        fileName: "Transcript_v1.pdf",
        date: "2025-11-02",
        note: "Undergraduate transcript draft.",
      },
      {
        id: "doc-transcript-v2",
        fileName: "Transcript_v2.pdf",
        date: "2026-03-12",
        note: "Updated with latest semester grades.",
      },
    ],
  },
  {
    id: "doc-ielts",
    name: "IELTS",
    category: "Language Test",
    note: "English proficiency score report.",
    uploadDate: "2026-01-20",
    versions: [
      {
        id: "doc-ielts-v1",
        fileName: "IELTS_2025.pdf",
        date: "2025-06-18",
      },
      {
        id: "doc-ielts-v2",
        fileName: "IELTS_2026.pdf",
        date: "2026-01-20",
        note: "Retake with improved overall band.",
      },
    ],
  },
  {
    id: "doc-passport",
    name: "Passport",
    category: "Identity",
    note: "Passport bio page scan.",
    uploadDate: "2025-12-01",
    versions: [
      {
        id: "doc-passport-v1",
        fileName: "Passport_scan.pdf",
        date: "2025-12-01",
      },
    ],
  },
  {
    id: "doc-id-card",
    name: "ID Card",
    category: "Identity",
    uploadDate: "2025-10-08",
    versions: [
      {
        id: "doc-id-v1",
        fileName: "ID_Card_front_back.pdf",
        date: "2025-10-08",
      },
    ],
  },
  {
    id: "doc-enrollment",
    name: "Enrollment Certificate",
    category: "Certificate",
    note: "Current enrollment verification letter.",
    uploadDate: "2026-02-05",
    versions: [
      {
        id: "doc-enrollment-v1",
        fileName: "Enrollment_Certificate.pdf",
        date: "2026-02-05",
      },
    ],
  },
];

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
  const [documents, setDocuments] = useState(initialDocuments);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredDocuments();
    if (stored) setDocuments(stored);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
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
      getDocument,
      getDocumentVersion,
      addDocument,
      updateDocument,
      deleteDocument,
      addDocumentVersion,
    }),
    [
      documents,
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
