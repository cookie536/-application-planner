"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type MaterialVersion = {
  id: string;
  name: string;
  date: string;
  note?: string;
  fileName?: string;
};

export type MaterialSource = "project" | "common";

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  versions: MaterialVersion[];
  /** Defaults to project-specific when omitted. */
  source?: MaterialSource;
  /** Reference into Common Documents — never a duplicated document. */
  commonDocumentId?: string;
  /** Reference to a Common Document version by ID. */
  versionId?: string;
};

export type Application = {
  id: string;
  school: string;
  program: string;
  country: string;
  status: string;
  deadline: string;
  checklist: ChecklistItem[];
};

const APPLICATIONS_STORAGE_KEY = "ai-application-planner:applications";

const psVersions: MaterialVersion[] = [
  {
    id: "v-ps-1",
    name: "PS v1",
    date: "2027-08-12",
    note: "Initial draft focusing on research interests.",
    fileName: "ps-v1.docx",
  },
  {
    id: "v-ps-2",
    name: "PS v2",
    date: "2027-09-03",
    note: "Revised after advisor feedback.",
    fileName: "ps-v2.docx",
  },
  {
    id: "v-ps-3",
    name: "PS Final",
    date: "2027-10-18",
    note: "Ready for review before submission.",
    fileName: "ps-final.pdf",
  },
  {
    id: "v-ps-4",
    name: "PS Submitted",
    date: "2027-11-02",
    note: "Submitted with the application package.",
    fileName: "ps-submitted.pdf",
  },
];

function sampleVersions(prefix: string, names: string[]): MaterialVersion[] {
  return names.map((name, index) => ({
    id: `${prefix}-v${index + 1}`,
    name,
    date: `2027-0${Math.min(index + 6, 9)}-${10 + index}`,
    note: index === 0 ? "First uploaded version." : undefined,
    fileName: `${name.toLowerCase().replace(/\s+/g, "-")}.pdf`,
  }));
}

export function isCommonLinkedMaterial(item: ChecklistItem) {
  return (
    item.source === "common" &&
    Boolean(item.commonDocumentId) &&
    Boolean(item.versionId)
  );
}

export const initialApplications: Application[] = [
  {
    id: "app-1",
    school: "CUHK",
    program: "MA Gender Studies",
    country: "Hong Kong",
    status: "Waiting Recommendation",
    deadline: "2027-12-01T23:59",
    checklist: [
      {
        id: "c1-1",
        label: "CV",
        done: true,
        source: "project",
        versions: sampleVersions("c1-1", ["CV v1", "CV Final"]),
      },
      {
        id: "c1-2",
        label: "IELTS",
        done: true,
        source: "common",
        commonDocumentId: "doc-ielts",
        versionId: "doc-ielts-v2",
        versions: sampleVersions("c1-2", ["IELTS Score Report"]),
      },
      {
        id: "c1-3",
        label: "PS",
        done: false,
        source: "project",
        versions: psVersions.map((version) => ({
          ...version,
          id: `c1-3-${version.id}`,
        })),
      },
      {
        id: "c1-4",
        label: "Recommendation",
        done: false,
        source: "project",
        versions: sampleVersions("c1-4", [
          "Recommendation Request",
          "Recommendation Draft",
        ]),
      },
    ],
  },
  {
    id: "app-2",
    school: "HKU",
    program: "MA Sociology",
    country: "Hong Kong",
    status: "Draft",
    deadline: "2028-01-15T23:59",
    checklist: [
      {
        id: "c2-1",
        label: "Transcript",
        done: true,
        source: "common",
        commonDocumentId: "doc-transcript",
        versionId: "doc-transcript-v2",
        versions: sampleVersions("c2-1", ["Official Transcript"]),
      },
      {
        id: "c2-2",
        label: "PS",
        done: false,
        source: "project",
        versions: psVersions.map((version) => ({
          ...version,
          id: `c2-2-${version.id}`,
        })),
      },
      {
        id: "c2-3",
        label: "Passport",
        done: false,
        source: "common",
        commonDocumentId: "doc-passport",
        versionId: "doc-passport-v1",
        versions: sampleVersions("c2-3", ["Passport Scan"]),
      },
    ],
  },
  {
    id: "app-3",
    school: "LSE",
    program: "MSc Gender",
    country: "United Kingdom",
    status: "Submitted",
    deadline: "2027-11-30T23:59",
    checklist: [
      {
        id: "c3-1",
        label: "CV",
        done: true,
        source: "project",
        versions: sampleVersions("c3-1", ["CV Submitted"]),
      },
      {
        id: "c3-2",
        label: "PS",
        done: true,
        source: "project",
        versions: psVersions.map((version) => ({
          ...version,
          id: `c3-2-${version.id}`,
        })),
      },
      {
        id: "c3-3",
        label: "IELTS",
        done: true,
        source: "common",
        commonDocumentId: "doc-ielts",
        versionId: "doc-ielts-v2",
        versions: sampleVersions("c3-3", ["IELTS Score Report"]),
      },
    ],
  },
];

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeChecklistItem(item: ChecklistItem): ChecklistItem {
  return {
    ...item,
    versions: item.versions ?? [],
    source: item.source ?? "project",
  };
}

function normalizeApplications(apps: Application[]): Application[] {
  return apps.map((app) => ({
    ...app,
    checklist: app.checklist.map(normalizeChecklistItem),
  }));
}

function readStoredApplications(): Application[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Application[];
    if (!Array.isArray(parsed)) return null;
    return normalizeApplications(parsed);
  } catch {
    return null;
  }
}

type ApplicationsContextValue = {
  applications: Application[];
  setApplications: Dispatch<SetStateAction<Application[]>>;
  getApplication: (applicationId: string) => Application | undefined;
  getMaterial: (
    applicationId: string,
    materialId: string,
  ) => { application: Application; material: ChecklistItem } | undefined;
  toggleChecklistItem: (applicationId: string, materialId: string) => void;
  updateApplication: (
    applicationId: string,
    updater: (app: Application) => Application,
  ) => void;
  updateMaterial: (
    applicationId: string,
    materialId: string,
    updates: Partial<
      Pick<
        ChecklistItem,
        | "label"
        | "done"
        | "versions"
        | "source"
        | "commonDocumentId"
        | "versionId"
      >
    >,
  ) => void;
  linkMaterialToCommonDocument: (
    applicationId: string,
    materialId: string,
    commonDocumentId: string,
    versionId: string,
  ) => void;
  unlinkMaterialFromCommonDocument: (
    applicationId: string,
    materialId: string,
  ) => void;
  deleteApplication: (applicationId: string) => void;
  addMaterialVersion: (
    applicationId: string,
    materialId: string,
    version: Omit<MaterialVersion, "id">,
  ) => void;
};

const ApplicationsContext = createContext<ApplicationsContextValue | null>(
  null,
);

export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState(initialApplications);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredApplications();
    if (stored) setApplications(stored);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    window.localStorage.setItem(
      APPLICATIONS_STORAGE_KEY,
      JSON.stringify(applications),
    );
  }, [applications, hasHydrated]);

  const getApplication = useCallback(
    (applicationId: string) =>
      applications.find((app) => app.id === applicationId),
    [applications],
  );

  const getMaterial = useCallback(
    (applicationId: string, materialId: string) => {
      const application = applications.find((app) => app.id === applicationId);
      if (!application) return undefined;
      const material = application.checklist.find(
        (item) => item.id === materialId,
      );
      if (!material) return undefined;
      return { application, material };
    },
    [applications],
  );

  const toggleChecklistItem = useCallback(
    (applicationId: string, materialId: string) => {
      setApplications((prev) =>
        prev.map((app) =>
          app.id !== applicationId
            ? app
            : {
                ...app,
                checklist: app.checklist.map((item) =>
                  item.id === materialId
                    ? { ...item, done: !item.done }
                    : item,
                ),
              },
        ),
      );
    },
    [],
  );

  const updateApplication = useCallback(
    (applicationId: string, updater: (app: Application) => Application) => {
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? updater(app) : app)),
      );
    },
    [],
  );

  const updateMaterial = useCallback(
    (
      applicationId: string,
      materialId: string,
      updates: Partial<
        Pick<
          ChecklistItem,
          | "label"
          | "done"
          | "versions"
          | "source"
          | "commonDocumentId"
          | "versionId"
        >
      >,
    ) => {
      setApplications((prev) =>
        prev.map((app) =>
          app.id !== applicationId
            ? app
            : {
                ...app,
                checklist: app.checklist.map((item) =>
                  item.id === materialId ? { ...item, ...updates } : item,
                ),
              },
        ),
      );
    },
    [],
  );

  const linkMaterialToCommonDocument = useCallback(
    (
      applicationId: string,
      materialId: string,
      commonDocumentId: string,
      versionId: string,
    ) => {
      updateMaterial(applicationId, materialId, {
        source: "common",
        commonDocumentId,
        versionId,
      });
    },
    [updateMaterial],
  );

  const unlinkMaterialFromCommonDocument = useCallback(
    (applicationId: string, materialId: string) => {
      setApplications((prev) =>
        prev.map((app) =>
          app.id !== applicationId
            ? app
            : {
                ...app,
                checklist: app.checklist.map((item) =>
                  item.id !== materialId
                    ? item
                    : {
                        ...item,
                        source: "project",
                        commonDocumentId: undefined,
                        versionId: undefined,
                      },
                ),
              },
        ),
      );
    },
    [],
  );

  const deleteApplication = useCallback((applicationId: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== applicationId));
  }, []);

  const addMaterialVersion = useCallback(
    (
      applicationId: string,
      materialId: string,
      version: Omit<MaterialVersion, "id">,
    ) => {
      setApplications((prev) =>
        prev.map((app) =>
          app.id !== applicationId
            ? app
            : {
                ...app,
                checklist: app.checklist.map((item) =>
                  item.id !== materialId
                    ? item
                    : {
                        ...item,
                        versions: [
                          {
                            id: createId("ver"),
                            ...version,
                          },
                          ...item.versions,
                        ],
                      },
                ),
              },
        ),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      applications,
      setApplications,
      getApplication,
      getMaterial,
      toggleChecklistItem,
      updateApplication,
      updateMaterial,
      linkMaterialToCommonDocument,
      unlinkMaterialFromCommonDocument,
      deleteApplication,
      addMaterialVersion,
    }),
    [
      applications,
      getApplication,
      getMaterial,
      toggleChecklistItem,
      updateApplication,
      updateMaterial,
      linkMaterialToCommonDocument,
      unlinkMaterialFromCommonDocument,
      deleteApplication,
      addMaterialVersion,
    ],
  );

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationsContext);
  if (!context) {
    throw new Error("useApplications must be used within ApplicationsProvider");
  }
  return context;
}
