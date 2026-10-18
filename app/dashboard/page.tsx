"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  createId,
  isCommonLinkedMaterial,
  useApplications,
  type Application,
  type ChecklistItem,
} from "@/app/applications-context";
import { useCommonDocuments } from "@/app/common-documents-context";
import { searchPrograms, type ProgramRecord } from "@/app/programs";
import { DEFAULT_STATUSES, displayCategory, displayStatus } from "@/app/ui-copy";
import {
  chipClass,
  chipSelectedClass,
  dangerButtonClass,
  dialogBodyClass,
  dialogClass,
  dialogFooterClass,
  EmptyState,
  fieldClass,
  labelClass,
  overlayClass,
  pageClass,
  primaryButtonClass,
  quietButtonClass,
  secondaryButtonClass,
  shellWideClass,
  statusPillClass,
  titleClass,
} from "@/app/ui";

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

function formatDeadline(deadline: string) {
  const date = new Date(deadline);
  if (!deadline || Number.isNaN(date.getTime())) return "未填写";

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function daysRemainingLabel(deadline: string) {
  const due = new Date(deadline);
  if (!deadline || Number.isNaN(due.getTime())) return "未填写";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  const days = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);

  if (days > 0) return `还有${days}天`;
  if (days === 0) return "今天截止";
  return `已逾期${Math.abs(days)}天`;
}

function toEditDraft(app: Application): EditDraft {
  const status = displayStatus(app.status);
  const isDefault = (DEFAULT_STATUSES as readonly string[]).includes(status);

  return {
    school: app.school,
    program: app.program,
    country: app.country,
    status,
    deadline: app.deadline,
    checklist: app.checklist.map((item) => ({
      ...item,
      versions: item.versions.map((version) => ({ ...version })),
    })),
    useCustomStatus: !isDefault,
    customStatus: isDefault ? "" : status,
  };
}

export default function DashboardPage() {
  const {
    applications,
    hasHydrated,
    loadSampleApplications,
    clearSampleApplications,
    addApplication,
    toggleChecklistItem,
    updateApplication,
    deleteApplication,
  } = useApplications();
  const { documents, hasHydrated: documentsHydrated } = useCommonDocuments();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [programQuery, setProgramQuery] = useState("");
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customSchool, setCustomSchool] = useState("");
  const [customProgram, setCustomProgram] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [customWebsite, setCustomWebsite] = useState("");
  const [customDeadline, setCustomDeadline] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const addTitleId = useId();
  const programResults = useMemo(
    () => searchPrograms(programQuery),
    [programQuery],
  );

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
    setIsAddModalOpen(false);
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
                status: "草稿",
                notes: [],
                source: "project",
                versions: [],
              },
            ],
          }
        : prev,
    );
  }

  function openAdd() {
    closeEdit();
    setProgramQuery("");
    setIsAddModalOpen(true);
  }

  function closeAdd() {
    setIsAddModalOpen(false);
    setProgramQuery("");
    setIsCustomOpen(false);
    setCustomSchool("");
    setCustomProgram("");
    setCustomCountry("");
    setCustomWebsite("");
    setCustomDeadline("");
  }

  function saveCustomApplication() {
    const school = customSchool.trim();
    if (!school) return;

    addApplication({
      school,
      program: customProgram.trim(),
      country: customCountry.trim(),
      status: "草稿",
      deadline: customDeadline,
      checklist: [],
      website: customWebsite.trim(),
      tuition: "",
      duration: "",
      languageRequirement: "",
    });
    closeAdd();
  }

  function selectProgram(program: ProgramRecord) {
    addApplication({
      school: program.school,
      program: program.program,
      country: program.country,
      status: "草稿",
      deadline: program.deadline,
      checklist: [],
      website: program.website,
      tuition: program.tuition,
      duration: program.duration,
      languageRequirement: program.languageRequirement,
    });
    closeAdd();
  }

  if (!hasHydrated || !documentsHydrated) {
    return <div className={pageClass} />;
  }

  return (
    <div className={pageClass}>
      <div className={shellWideClass}>
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className={titleClass}>申请规划</h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/common-documents" className={secondaryButtonClass}>
              通用材料
            </Link>
            {applications.length > 0 ? (
              <button type="button" onClick={openAdd} className={primaryButtonClass}>
                添加申请
              </button>
            ) : null}
          </div>
        </header>

        {applications.some((app) => app.isDemo) ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-zinc-100 px-5 py-4">
            <p className="text-sm text-zinc-600">示例数据 · 学校、截止日期和材料进度仅用于演示，可自由编辑。</p>
            <button type="button" onClick={clearSampleApplications} className={quietButtonClass}>
              清除示例数据
            </button>
          </div>
        ) : null}

        {applications.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="开始规划你的申请"
              description="添加你的第一个申请，或通过示例数据快速了解 Application Planner。"
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={openAdd} className={primaryButtonClass}>
                    添加申请
                  </button>
                  <button type="button" onClick={loadSampleApplications} className={secondaryButtonClass}>
                    查看示例
                  </button>
                </div>
              }
            />
          </div>
        ) : (
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => {
            const status = displayStatus(app.status);
            return (
            <article
              key={app.id}
              className="relative flex flex-col rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6"
            >
              <div
                className="absolute right-4 top-4"
                ref={openMenuId === app.id ? menuRef : undefined}
              >
                <button
                  type="button"
                  aria-label="申请选项"
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
                    className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openEdit(app)}
                      className="block w-full px-3.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-50"
                    >
                      编辑申请
                    </button>
                    <Link
                      href={`/applications/${app.id}`}
                      role="menuitem"
                      className="block w-full px-3.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-50"
                    >
                      打开工作台
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleDeleteApplication(app.id)}
                      className="block w-full px-3.5 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      删除申请
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="pr-8">
                <Link href={`/applications/${app.id}`} className="block">
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                    {app.school.trim() || "未填写"}
                    {app.isDemo ? <span className="ml-2 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 align-middle text-xs font-medium text-zinc-500">示例</span> : null}
                  </h2>
                  <p className="mt-1 text-base font-medium text-zinc-800">
                    {app.program.trim() || "未填写"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {app.country.trim() || "未填写"}
                  </p>
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                    <span
                      className={`inline-flex h-7 items-center rounded-full px-2.5 text-sm font-medium ${statusPillClass(status)}`}
                    >
                      {status || "未填写"}
                    </span>
                    <div className="text-right">
                      <p className="text-[13px] text-zinc-400">截止日期</p>
                      <p className="text-sm font-medium text-zinc-950">
                        {formatDeadline(app.deadline)}
                      </p>
                      <p className="mt-1 text-[13px] text-zinc-400">剩余天数</p>
                      <p className="text-sm text-zinc-600">
                        {daysRemainingLabel(app.deadline)}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>

              {app.checklist.length === 0 ? (
                <p className="mt-5 text-sm text-zinc-400">
                  暂无材料。打开申请后可以添加。
                </p>
              ) : (
              <div className="mt-5">
                <p className="text-[13px] font-medium text-zinc-400">材料</p>
                <ul className="mt-3 space-y-2.5">
                  {app.checklist.map((item) => {
                    const shared = isCommonLinkedMaterial(item)
                      ? documents.find((doc) => doc.id === item.commonDocumentId)
                      : undefined;
                    const title = shared?.name || item.label;
                    return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 text-[15px] text-zinc-800"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleChecklistItem(app.id, item.id)}
                        className="size-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900"
                        aria-label={`将${title}标为完成`}
                      />
                      <Link
                        href={`/applications/${app.id}/materials/${item.id}`}
                        className={`min-w-0 hover:underline ${
                          item.done ? "text-zinc-500 line-through" : ""
                        }`}
                      >
                        {title}
                        {shared ? (
                          <span className="ml-1.5 text-xs font-normal text-zinc-400 no-underline">
                            · {displayCategory(shared.category)}
                          </span>
                        ) : null}
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
                    );
                  })}
                </ul>
              </div>
              )}
            </article>
            );
          })}
        </section>
        )}
      </div>

      {isAddModalOpen ? (
        <div
          className={overlayClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby={addTitleId}
          onClick={closeAdd}
        >
          <div
            className={dialogClass}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={dialogBodyClass}>
              <h2
                id={addTitleId}
                className="text-xl font-semibold tracking-tight text-zinc-950"
              >
                添加申请
              </h2>
              {isCustomOpen ? null : (
              <div className="mt-6">
                <label htmlFor="program-search" className={labelClass}>
                  搜索学校或项目
                </label>
                <input
                  id="program-search"
                  type="text"
                  value={programQuery}
                  onChange={(event) => setProgramQuery(event.target.value)}
                  placeholder="例如：HKU 或 Sociology"
                  className={fieldClass}
                  autoFocus
                />
              </div>
              )}
              {isCustomOpen ? (
                <div className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="custom-school" className={labelClass}>
                      学校 *
                    </label>
                    <input
                      id="custom-school"
                      type="text"
                      value={customSchool}
                      onChange={(event) => setCustomSchool(event.target.value)}
                      className={fieldClass}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-program" className={labelClass}>
                      项目
                    </label>
                    <input
                      id="custom-program"
                      type="text"
                      value={customProgram}
                      onChange={(event) => setCustomProgram(event.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-country" className={labelClass}>
                      国家
                    </label>
                    <input
                      id="custom-country"
                      type="text"
                      value={customCountry}
                      onChange={(event) => setCustomCountry(event.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-website" className={labelClass}>
                      官方网站
                    </label>
                    <input
                      id="custom-website"
                      type="url"
                      value={customWebsite}
                      onChange={(event) => setCustomWebsite(event.target.value)}
                      placeholder="例如：https://"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-deadline" className={labelClass}>
                      截止日期
                    </label>
                    <input
                      id="custom-deadline"
                      type="datetime-local"
                      value={customDeadline}
                      onChange={(event) => setCustomDeadline(event.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>
              ) : (
              <ul className="mt-4 space-y-1">
                {programResults.length === 0 ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => setIsCustomOpen(true)}
                      className="w-full rounded-xl px-3 py-3 text-left text-[15px] font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
                    >
                      + 创建自定义申请
                    </button>
                  </li>
                ) : (
                  programResults.map((program) => (
                    <li key={program.id}>
                      <button
                        type="button"
                        onClick={() => selectProgram(program)}
                        className="w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-zinc-50"
                      >
                        <p className="text-[15px] font-semibold text-zinc-950">
                          {program.school}
                        </p>
                        <p className="mt-0.5 text-[15px] text-zinc-700">
                          {program.program}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-500">
                          {program.country}
                        </p>
                      </button>
                    </li>
                  ))
                )}
              </ul>
              )}
            </div>
            <div className={dialogFooterClass}>
              <button
                type="button"
                onClick={closeAdd}
                className={`${secondaryButtonClass} flex-1`}
              >
                取消
              </button>
              {isCustomOpen ? (
                <button
                  type="button"
                  onClick={saveCustomApplication}
                  disabled={!customSchool.trim()}
                  className={`${primaryButtonClass} flex-1`}
                >
                  保存
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {editingId && draft ? (
        <div
          className={overlayClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={closeEdit}
        >
          <div
            className={dialogClass}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={dialogBodyClass}>
              <h2
                id={titleId}
                className="text-xl font-semibold tracking-tight text-zinc-900"
              >
                编辑申请
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="edit-school" className={labelClass}>
                    学校
                  </label>
                  <input
                    id="edit-school"
                    type="text"
                    value={draft.school}
                    onChange={(event) =>
                      updateDraft({ school: event.target.value })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="edit-program" className={labelClass}>
                    项目
                  </label>
                  <input
                    id="edit-program"
                    type="text"
                    value={draft.program}
                    onChange={(event) =>
                      updateDraft({ program: event.target.value })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="edit-country" className={labelClass}>
                    国家或地区
                  </label>
                  <input
                    id="edit-country"
                    type="text"
                    value={draft.country}
                    onChange={(event) =>
                      updateDraft({ country: event.target.value })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="edit-deadline" className={labelClass}>
                    截止日期
                  </label>
                  <input
                    id="edit-deadline"
                    type="datetime-local"
                    value={draft.deadline}
                    onChange={(event) =>
                      updateDraft({ deadline: event.target.value })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <p className={labelClass}>状态</p>
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
                          className={selected ? chipSelectedClass : chipClass}
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
                      className={`mt-3 ${quietButtonClass}`}
                    >
                      添加自定义状态
                    </button>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={draft.customStatus}
                        onChange={(event) =>
                          updateDraft({ customStatus: event.target.value })
                        }
                        placeholder="例如：等待推荐信"
                        className={fieldClass}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft({
                            useCustomStatus: false,
                            status: draft.status || "草稿",
                            customStatus: "",
                          })
                        }
                        className={quietButtonClass}
                      >
                        使用默认状态
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <p className={labelClass}>所需材料</p>
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
                          aria-label={`将${item.label || "材料"}标为完成`}
                        />
                        <input
                          type="text"
                          value={item.label}
                          onChange={(event) =>
                            updateMaterial(item.id, {
                              label: event.target.value,
                            })
                          }
                          placeholder="材料名称"
                          className={`${fieldClass} mt-0 min-w-0 flex-1`}
                        />
                        <button
                          type="button"
                          onClick={() => deleteMaterial(item.id)}
                          className={dangerButtonClass}
                          aria-label={`删除${item.label || "材料"}`}
                        >
                          删除
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={addMaterial}
                    className={`mt-3 ${quietButtonClass}`}
                  >
                    添加材料
                  </button>
                </div>
              </div>
            </div>

            <div className={dialogFooterClass}>
              <button
                type="button"
                onClick={closeEdit}
                className={`${secondaryButtonClass} flex-1`}
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveChanges}
                className={`${primaryButtonClass} flex-1`}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
