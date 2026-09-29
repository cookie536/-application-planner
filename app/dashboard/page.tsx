"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  createId,
  isCommonLinkedMaterial,
  useApplications,
  type Application,
  type ChecklistItem,
} from "@/app/applications-context";

type EditDraft = {
  school: string;
  program: string;
  country: string;
  status: string;
  deadline: string;
  checklist: ChecklistItem[];
  useCustomStatus: boolean;
  customStatus: string;
};

const DEFAULT_STATUSES = [
  "Draft",
  "Submitted",
  "Waiting",
  "Interview",
  "Offer",
  "Rejected",
] as const;

function formatDeadline(deadline: string) {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return deadline;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function toEditDraft(app: Application): EditDraft {
  const isDefault = (DEFAULT_STATUSES as readonly string[]).includes(app.status);

  return {
    school: app.school,
    program: app.program,
    country: app.country,
    status: app.status,
    deadline: app.deadline,
    checklist: app.checklist.map((item) => ({
      ...item,
      versions: item.versions.map((version) => ({ ...version })),
    })),
    useCustomStatus: !isDefault,
    customStatus: isDefault ? "" : app.status,
  };
}

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400";

const labelClassName =
  "text-xs font-medium uppercase tracking-wide text-zinc-400";

export default function DashboardPage() {
  const {
    applications,
    toggleChecklistItem,
    updateApplication,
    deleteApplication,
  } = useApplications();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!openMenuId) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openMenuId]);

  function openEdit(app: Application) {
    setOpenMenuId(null);
    setEditingId(app.id);
    setDraft(toEditDraft(app));
  }

  function closeEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function handleDeleteApplication(appId: string) {
    setOpenMenuId(null);
    deleteApplication(appId);
    if (editingId === appId) closeEdit();
  }

  function saveChanges() {
    if (!editingId || !draft) return;

    const nextStatus = draft.useCustomStatus
      ? draft.customStatus.trim()
      : draft.status;

    if (!nextStatus) return;

    updateApplication(editingId, (app) => ({
      ...app,
      school: draft.school.trim(),
      program: draft.program.trim(),
      country: draft.country.trim(),
      status: nextStatus,
      deadline: draft.deadline,
      checklist: draft.checklist
        .map((item) => ({
          ...item,
          label: item.label.trim(),
          versions: item.versions ?? [],
          source: item.source ?? "project",
          commonDocumentId: item.commonDocumentId,
          versionId: item.versionId,
        }))
        .filter((item) => item.label.length > 0),
    }));
    closeEdit();
  }

  function updateDraft(partial: Partial<EditDraft>) {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  function updateMaterial(
    itemId: string,
    partial: Partial<Pick<ChecklistItem, "label" | "done">>,
  ) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            checklist: prev.checklist.map((item) =>
              item.id === itemId ? { ...item, ...partial } : item,
            ),
          }
        : prev,
    );
  }

  function deleteMaterial(itemId: string) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            checklist: prev.checklist.filter((item) => item.id !== itemId),
          }
        : prev,
    );
  }

  function addMaterial() {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            checklist: [
              ...prev.checklist,
              {
                id: createId("mat"),
                label: "",
                done: false,
                source: "project",
                versions: [],
              },
            ],
          }
        : prev,
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-8 sm:py-14">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800"
            >
              ← Home
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              AI Application Planner
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/common-documents"
              className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50"
            >
              通用材料库
            </Link>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
            >
              + Add Application
            </button>
          </div>
        </header>

        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <article
              key={app.id}
              className="relative flex flex-col rounded-2xl border border-black/[0.04] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]"
            >
              <div
                className="absolute right-4 top-4"
                ref={openMenuId === app.id ? menuRef : undefined}
              >
                <button
                  type="button"
                  aria-label="Application options"
                  aria-expanded={openMenuId === app.id}
                  aria-haspopup="menu"
                  onClick={() =>
                    setOpenMenuId((current) =>
                      current === app.id ? null : app.id,
                    )
                  }
                  className="flex size-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <span className="text-lg leading-none tracking-widest">
                    ···
                  </span>
                </button>

                {openMenuId === app.id ? (
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openEdit(app)}
                      className="block w-full px-3.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-50"
                    >
                      Edit Application
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleDeleteApplication(app.id)}
                      className="block w-full px-3.5 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      Delete Application
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 pr-8">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    School
                  </p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900">
                    {app.school}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Program
                  </p>
                  <p className="mt-1 text-[15px] text-zinc-700">{app.program}</p>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Status
                    </p>
                    <p className="mt-1 text-[15px] text-zinc-700">{app.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Deadline
                    </p>
                    <p className="mt-1 text-[15px] font-medium text-zinc-900">
                      {formatDeadline(app.deadline)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-zinc-100 pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Checklist
                </p>
                <ul className="mt-3 space-y-2.5">
                  {app.checklist.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 text-[15px] text-zinc-800"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleChecklistItem(app.id, item.id)}
                        className="size-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900"
                        aria-label={`Mark ${item.label} complete`}
                      />
                      <Link
                        href={`/applications/${app.id}/materials/${item.id}`}
                        className={`min-w-0 hover:underline ${
                          item.done ? "text-zinc-500 line-through" : ""
                        }`}
                      >
                        {item.label}
                        <span
                          className={`ml-1.5 text-xs font-normal no-underline ${
                            item.done ? "text-zinc-400" : "text-zinc-400"
                          }`}
                        >
                          ·{" "}
                          {isCommonLinkedMaterial(item)
                            ? "通用材料"
                            : "项目专属"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>
      </div>

      {isAddModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-application-title"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_16px_48px_rgba(0,0,0,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="add-application-title"
              className="text-xl font-semibold tracking-tight text-zinc-900"
            >
              Application Form Coming Soon.
            </h2>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="mt-8 w-full rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {editingId && draft ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8 backdrop-blur-sm sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={closeEdit}
        >
          <div
            className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="overflow-y-auto px-6 py-7 sm:px-8">
              <h2
                id={titleId}
                className="text-xl font-semibold tracking-tight text-zinc-900"
              >
                Edit Application
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="edit-school" className={labelClassName}>
                    School
                  </label>
                  <input
                    id="edit-school"
                    type="text"
                    value={draft.school}
                    onChange={(event) =>
                      updateDraft({ school: event.target.value })
                    }
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label htmlFor="edit-program" className={labelClassName}>
                    Program
                  </label>
                  <input
                    id="edit-program"
                    type="text"
                    value={draft.program}
                    onChange={(event) =>
                      updateDraft({ program: event.target.value })
                    }
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label htmlFor="edit-country" className={labelClassName}>
                    Country
                  </label>
                  <input
                    id="edit-country"
                    type="text"
                    value={draft.country}
                    onChange={(event) =>
                      updateDraft({ country: event.target.value })
                    }
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label htmlFor="edit-deadline" className={labelClassName}>
                    Deadline
                  </label>
                  <input
                    id="edit-deadline"
                    type="datetime-local"
                    value={draft.deadline}
                    onChange={(event) =>
                      updateDraft({ deadline: event.target.value })
                    }
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <p className={labelClassName}>Status</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DEFAULT_STATUSES.map((status) => {
                      const selected =
                        !draft.useCustomStatus && draft.status === status;

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            updateDraft({
                              status,
                              useCustomStatus: false,
                              customStatus: "",
                            })
                          }
                          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                            selected
                              ? "bg-zinc-900 text-white"
                              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>

                  {!draft.useCustomStatus ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft({
                          useCustomStatus: true,
                          customStatus: draft.customStatus || "",
                        })
                      }
                      className="mt-3 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900"
                    >
                      + Add custom status
                    </button>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={draft.customStatus}
                        onChange={(event) =>
                          updateDraft({ customStatus: event.target.value })
                        }
                        placeholder='e.g. "Waiting for Recommendation"'
                        className={fieldClassName}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft({
                            useCustomStatus: false,
                            status: draft.status || "Draft",
                            customStatus: "",
                          })
                        }
                        className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800"
                      >
                        Use default statuses
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <p className={labelClassName}>Required Materials</p>
                  <ul className="mt-3 space-y-2.5">
                    {draft.checklist.map((item) => (
                      <li key={item.id} className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() =>
                            updateMaterial(item.id, { done: !item.done })
                          }
                          className="size-4 shrink-0 rounded border-zinc-300 text-zinc-900 accent-zinc-900"
                          aria-label={`Mark ${item.label || "material"} complete`}
                        />
                        <input
                          type="text"
                          value={item.label}
                          onChange={(event) =>
                            updateMaterial(item.id, {
                              label: event.target.value,
                            })
                          }
                          placeholder="Material name"
                          className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[15px] text-zinc-900 outline-none transition-colors focus:border-zinc-400"
                        />
                        <button
                          type="button"
                          onClick={() => deleteMaterial(item.id)}
                          className="shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                          aria-label={`Delete ${item.label || "material"}`}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={addMaterial}
                    className="mt-3 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900"
                  >
                    + Add material
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-zinc-100 px-6 py-4 sm:px-8">
              <button
                type="button"
                onClick={closeEdit}
                className="flex-1 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveChanges}
                className="flex-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
