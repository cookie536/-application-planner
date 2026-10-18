"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createSampleApplications } from "@/app/sample-applications";
import {
  buildTimelineEvents,
  type Milestone,
  type TimelineEvent,
} from "@/app/timeline-events";

export type MaterialVersion = {
  id: string;
  name: string;
  date: string;
  note?: string;
  fileName?: string;
};

export type MaterialSource = "project" | "common";

export const MATERIAL_STATUSES = ["草稿", "已完成", "已提交"] as const;

export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];

export type MaterialNote = {
  id: string;
  text: string;
  createdAt: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  status: MaterialStatus;
  notes: MaterialNote[];
  versions: MaterialVersion[];
  /** Defaults to project-specific when omitted. */
  source?: MaterialSource;
  /** Reference into Common Documents — never a duplicated document. */
  commonDocumentId?: string;
  /** Reference to a Common Document version by ID. */
  versionId?: string;
  /** Reference into 文件库. The file itself stays in IndexedDB. */
  documentId?: string;
};

export type ApplicationNote = {
  id: string;
  text: string;
  createdAt: string;
};

export type Application = {
  isDemo?: boolean;
  id: string;
  school: string;
  program: string;
  country: string;
  status: string;
  deadline: string;
  checklist: ChecklistItem[];
  notes: ApplicationNote[];
  website: string;
  tuition: string;
  duration: string;
  languageRequirement: string;
};

const APPLICATIONS_STORAGE_KEY = "ai-application-planner:applications:v2";
const LEGACY_APPLICATIONS_STORAGE_KEY = "ai-application-planner:applications";
const MILESTONES_STORAGE_KEY = "ai-application-planner:milestones:v1";

export function isCommonLinkedMaterial(item: ChecklistItem) {
  return (
    item.source === "common" &&
    Boolean(item.commonDocumentId) &&
    Boolean(item.versionId)
  );
}

export { type Milestone, type TimelineEvent } from "@/app/timeline-events";

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeMaterialNotes(notes: unknown): MaterialNote[] {
  if (!Array.isArray(notes)) return [];
  return notes.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const text =
      "text" in item && typeof item.text === "string" ? item.text.trim() : "";
    if (!text) return [];
    const id =
      "id" in item && typeof item.id === "string" && item.id
        ? item.id
        : createId("mnote");
    const createdAt =
      "createdAt" in item &&
      typeof item.createdAt === "string" &&
      item.createdAt
        ? item.createdAt
        : new Date().toISOString();
    return [{ id, text, createdAt }];
  });
}

function normalizeMaterialStatus(
  status: unknown,
  done: boolean,
): MaterialStatus {
  if (
    status === "草稿" ||
    status === "已完成" ||
    status === "已提交"
  ) {
    return status;
  }
  return done ? "已完成" : "草稿";
}

function normalizeChecklistItem(item: ChecklistItem): ChecklistItem {
  const status = normalizeMaterialStatus(item.status, item.done);
  return {
    ...item,
    versions: item.versions ?? [],
    source: item.source ?? "project",
    notes: normalizeMaterialNotes(item.notes),
    status,
    done: status !== "草稿",
    documentId:
      typeof item.documentId === "string" && item.documentId
        ? item.documentId
        : undefined,
  };
}

function normalizeNotes(notes: unknown): ApplicationNote[] {
  if (Array.isArray(notes)) {
    return notes.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const text = "text" in item && typeof item.text === "string" ? item.text.trim() : "";
      if (!text) return [];
      const id =
        "id" in item && typeof item.id === "string" && item.id
          ? item.id
          : createId("note");
      const createdAt =
        "createdAt" in item && typeof item.createdAt === "string" && item.createdAt
          ? item.createdAt
          : new Date().toISOString();
      return [{ id, text, createdAt }];
    });
  }

  if (typeof notes === "string" && notes.trim()) {
    return [
      {
        id: createId("note"),
        text: notes.trim(),
        createdAt: new Date().toISOString(),
      },
    ];
  }

  return [];
}

function normalizeApplications(apps: Application[]): Application[] {
  return apps.map((app) => {
    const { milestones: _nested, ...rest } = app as Application & {
      milestones?: Milestone[];
      notes?: unknown;
    };
    return {
      ...rest,
      checklist: (rest.checklist ?? []).map(normalizeChecklistItem),
      notes: normalizeNotes(rest.notes),
      website: rest.website ?? "",
      tuition: rest.tuition ?? "",
      duration: rest.duration ?? "",
      languageRequirement: rest.languageRequirement ?? "",
    };
  });
}

function extractNestedMilestones(apps: unknown): Milestone[] {
  if (!Array.isArray(apps)) return [];
  const extracted: Milestone[] = [];
  for (const app of apps) {
    if (!app || typeof app !== "object" || !("milestones" in app)) continue;
    const nested = (app as { milestones?: Milestone[] }).milestones;
    if (!Array.isArray(nested)) continue;
    for (const item of nested) {
      if (!item?.title || !item?.date) continue;
      extracted.push({
        id: item.id || createId("ms"),
        title: item.title,
        date: item.date,
      });
    }
  }
  return extracted;
}

function mergeMilestones(primary: Milestone[], extra: Milestone[]) {
  const byId = new Map<string, Milestone>();
  for (const item of [...primary, ...extra]) {
    byId.set(item.id, item);
  }
  return [...byId.values()];
}

function readStoredMilestones(): Milestone[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MILESTONES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Milestone[];
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item) => item && typeof item.title === "string" && typeof item.date === "string",
    );
  } catch {
    return null;
  }
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
  hasHydrated: boolean;
  loadSampleApplications: () => void;
  clearSampleApplications: () => void;
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
        | "status"
        | "notes"
        | "versions"
        | "source"
        | "commonDocumentId"
        | "versionId"
        | "documentId"
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
  addApplication: (
    input: Omit<
      Application,
      "id" | "notes" | "website" | "tuition" | "duration" | "languageRequirement"
    > & {
      notes?: ApplicationNote[];
      website?: string;
      tuition?: string;
      duration?: string;
      languageRequirement?: string;
    },
  ) => string;
  addMilestone: (milestone: Omit<Milestone, "id">) => void;
  milestones: Milestone[];
  timelineEvents: TimelineEvent<Application>[];
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
  const [applications, setApplications] = useState<Application[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const persistReady = useRef(false);

  useEffect(() => {
    window.localStorage.removeItem(LEGACY_APPLICATIONS_STORAGE_KEY);
    const rawApps = window.localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    let nested: Milestone[] = [];
    if (rawApps) {
      try {
        nested = extractNestedMilestones(JSON.parse(rawApps));
      } catch {
        nested = [];
      }
    }
    const stored = readStoredApplications();
    if (stored) setApplications(stored);
    const storedMilestones = readStoredMilestones() ?? [];
    setMilestones(mergeMilestones(storedMilestones, nested));
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!persistReady.current) {
      persistReady.current = true;
      return;
    }
    window.localStorage.setItem(
      APPLICATIONS_STORAGE_KEY,
      JSON.stringify(applications),
    );
    window.localStorage.setItem(
      MILESTONES_STORAGE_KEY,
      JSON.stringify(milestones),
    );
  }, [applications, milestones, hasHydrated]);

  const loadSampleApplications = useCallback(() => {
    if (!hasHydrated) return;
    // Check current state inside the updater: repeated clicks cannot replace data.
    setApplications((current) =>
      current.length === 0 ? createSampleApplications() : current,
    );
  }, [hasHydrated]);

  const clearSampleApplications = useCallback(() => {
    setApplications((current) => current.filter((app) => app.isDemo !== true));
  }, []);

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
                checklist: app.checklist.map((item) => {
                  if (item.id !== materialId) return item;
                  const done = !item.done;
                  const status: MaterialStatus = done
                    ? item.status === "已提交"
                      ? "已提交"
                      : "已完成"
                    : "草稿";
                  return { ...item, done, status };
                }),
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
          | "status"
          | "notes"
          | "versions"
          | "source"
          | "commonDocumentId"
          | "versionId"
          | "documentId"
        >
      >,
    ) => {
      setApplications((prev) =>
        prev.map((app) =>
          app.id !== applicationId
            ? app
            : {
                ...app,
                checklist: app.checklist.map((item) => {
                  if (item.id !== materialId) return item;
                  const next = { ...item, ...updates };
                  if ("documentId" in updates && !updates.documentId) {
                    delete next.documentId;
                  }
                  if (
                    updates.status !== undefined &&
                    updates.done === undefined
                  ) {
                    next.done = updates.status !== "草稿";
                  } else if (
                    updates.done !== undefined &&
                    updates.status === undefined
                  ) {
                    next.status = updates.done
                      ? item.status === "已提交"
                        ? "已提交"
                        : "已完成"
                      : "草稿";
                  }
                  return next;
                }),
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

  const addApplication = useCallback(
    (
      input: Omit<
        Application,
        | "id"
        | "notes"
        | "website"
        | "tuition"
        | "duration"
        | "languageRequirement"
      > & {
        notes?: ApplicationNote[];
        website?: string;
        tuition?: string;
        duration?: string;
        languageRequirement?: string;
      },
    ) => {
    const id = createId("app");
    setApplications((prev) => [
      {
        ...input,
        id,
        checklist: input.checklist.map(normalizeChecklistItem),
        notes: input.notes ?? [],
        website: input.website ?? "",
        tuition: input.tuition ?? "",
        duration: input.duration ?? "",
        languageRequirement: input.languageRequirement ?? "",
      },
      ...prev,
    ]);
    return id;
  },
  []);

  const addMilestone = useCallback((milestone: Omit<Milestone, "id">) => {
    setMilestones((prev) => [
      ...prev,
      {
        id: createId("ms"),
        title: milestone.title,
        date: milestone.date,
      },
    ]);
  }, []);

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

  const timelineEvents = useMemo(
    () => buildTimelineEvents(applications, milestones),
    [applications, milestones],
  );

  const value = useMemo(
    () => ({
      applications,
      hasHydrated,
      loadSampleApplications,
      clearSampleApplications,
      setApplications,
      getApplication,
      getMaterial,
      toggleChecklistItem,
      updateApplication,
      updateMaterial,
      linkMaterialToCommonDocument,
      unlinkMaterialFromCommonDocument,
      addApplication,
      addMilestone,
      milestones,
      timelineEvents,
      deleteApplication,
      addMaterialVersion,
    }),
    [
      applications,
      hasHydrated,
      loadSampleApplications,
      clearSampleApplications,
      getApplication,
      getMaterial,
      toggleChecklistItem,
      updateApplication,
      updateMaterial,
      linkMaterialToCommonDocument,
      unlinkMaterialFromCommonDocument,
      addApplication,
      addMilestone,
      milestones,
      timelineEvents,
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
