"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  createId,
  isCommonLinkedMaterial,
  useApplications,
  type ChecklistItem,
} from "@/app/applications-context";
import { NotesSection } from "@/app/applications/[applicationId]/notes-section";
import { useCommonDocuments } from "@/app/common-documents-context";
import { displayCategory, displayStatus } from "@/app/ui-copy";
import {
  backLinkClass,
  cardClass,
  cardTitleClass,
  fieldClass,
  labelClass,
  leadClass,
  pageClass,
  primaryButtonClass,
  quietButtonClass,
  secondaryButtonClass,
  shellClass,
  statusPillClass,
  titleClass,
} from "@/app/ui";

function toDateTimeLocal(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.slice(0, 16);
  return "";
}

function EditableValue({
  label,
  value,
  onSave,
  inputType = "text",
  placeholder,
  display,
  href,
}: {
  label: string;
  value: string;
  onSave: (next: string) => void;
  inputType?: "text" | "url" | "datetime-local";
  placeholder?: string;
  display?: string;
  href?: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function open() {
    setDraft(inputType === "datetime-local" ? toDateTimeLocal(value) : value);
    setEditing(true);
  }

  function save() {
    onSave(draft.trim());
    setEditing(false);
  }

  return (
    <div>
      <dt className={labelClass}>{label}</dt>
      {editing ? (
        <div>
          <input
            type={inputType}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
            className={fieldClass}
            autoFocus
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={secondaryButtonClass}
            >
              取消
            </button>
            <button type="button" onClick={save} className={primaryButtonClass}>
              保存
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-1 flex items-start justify-between gap-3">
          <dd className="min-w-0 break-words text-[15px] text-zinc-950">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {value.trim()}
              </a>
            ) : (
              (display ?? (value.trim() || "未填写"))
            )}
          </dd>
          <button
            type="button"
            onClick={open}
            className={`${quietButtonClass} shrink-0`}
          >
            编辑
          </button>
        </div>
      )}
    </div>
  );
}

function displayText(value: string) {
  return value.trim() || "未填写";
}

function formatDeadline(deadline: string) {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "未填写";

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDaysRemaining(deadline: string) {
  const due = new Date(deadline);
  if (Number.isNaN(due.getTime())) return "未填写";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  const days = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);

  if (days > 0) return `还有${days}天`;
  if (days === 0) return "今天截止";
  return `已逾期${Math.abs(days)}天`;
}

function websiteHref(website: string) {
  const trimmed = website.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function ApplicationDetailPage() {
  const params = useParams<{ applicationId: string }>();
  const { getApplication, updateApplication, hasHydrated } = useApplications();
  const { documents, hasHydrated: documentsHydrated } = useCommonDocuments();
  const application = getApplication(params.applicationId);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [materialDraft, setMaterialDraft] = useState("");

  if (!hasHydrated || !documentsHydrated) {
    return <div className="flex flex-1 flex-col bg-[#f5f5f7]" />;
  }

  if (!application) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f5f5f7] px-6 py-16">
        <p className="text-lg text-zinc-600">未找到该申请。</p>
        <Link href="/dashboard" className={`${primaryButtonClass} mt-6`}>
          返回主页
        </Link>
      </div>
    );
  }

  const website = application.website.trim();
  const href = websiteHref(website);
  const applicationId = application.id;

  function addNote(text: string) {
    updateApplication(applicationId, (app) => ({
      ...app,
      notes: [
        {
          id: createId("note"),
          text,
          createdAt: new Date().toISOString(),
        },
        ...app.notes,
      ],
    }));
  }

  function editNote(noteId: string, text: string) {
    updateApplication(applicationId, (app) => ({
      ...app,
      notes: app.notes.map((note) =>
        note.id === noteId ? { ...note, text } : note,
      ),
    }));
  }

  function deleteNote(noteId: string) {
    updateApplication(applicationId, (app) => ({
      ...app,
      notes: app.notes.filter((note) => note.id !== noteId),
    }));
  }

  function saveField(
    key: "website" | "tuition" | "duration" | "languageRequirement" | "deadline",
    value: string,
  ) {
    updateApplication(applicationId, (app) => ({ ...app, [key]: value }));
  }

  function saveMaterial() {
    const label = materialDraft.trim();
    if (!label) return;
    const item: ChecklistItem = {
      id: createId("mat"),
      label,
      done: false,
      status: "草稿",
      notes: [],
      source: "project",
      versions: [],
    };
    updateApplication(applicationId, (app) => ({
      ...app,
      checklist: [...app.checklist, item],
    }));
    setMaterialDraft("");
    setIsAddingMaterial(false);
  }

  function sharedDocument(item: ChecklistItem) {
    if (!isCommonLinkedMaterial(item) || !item.commonDocumentId) return undefined;
    return documents.find((doc) => doc.id === item.commonDocumentId);
  }

  const status = displayStatus(application.status) || "未填写";

  return (
    <div className={pageClass}>
      <div className={`${shellClass} flex flex-col gap-4`}>
        <header>
          <Link href="/dashboard" className={backLinkClass}>
            ← 主页
          </Link>
          <h1 className={`mt-3 ${titleClass}`}>{displayText(application.school)}</h1>
          <p className={leadClass}>{displayText(application.program)}</p>
        </header>

        <section aria-labelledby="overview-title" className={cardClass}>
          <h2 id="overview-title" className={cardTitleClass}>
            项目概览
          </h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className={labelClass}>国家或地区</dt>
              <dd className="mt-1 text-[15px] text-zinc-950">
                {displayText(application.country)}
              </dd>
            </div>
            <div>
              <dt className={labelClass}>状态</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex h-7 items-center rounded-full px-2.5 text-sm font-medium ${statusPillClass(status)}`}
                >
                  {status}
                </span>
              </dd>
            </div>
            <EditableValue
              label="截止日期"
              value={application.deadline}
              display={formatDeadline(application.deadline)}
              inputType="datetime-local"
              onSave={(value) => saveField("deadline", value)}
            />
            <div>
              <dt className={labelClass}>剩余天数</dt>
              <dd className="mt-1 text-[15px] font-medium text-zinc-950">
                {formatDaysRemaining(application.deadline)}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="materials-title" className={cardClass}>
          <h2 id="materials-title" className={cardTitleClass}>
            材料
          </h2>
          {application.checklist.length === 0 && !isAddingMaterial ? (
            <div className="mt-6 text-center">
              <p className="text-[15px] text-zinc-500">暂无材料</p>
              <button
                type="button"
                onClick={() => setIsAddingMaterial(true)}
                className={`${primaryButtonClass} mt-5`}
              >
                立即添加材料
              </button>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {application.checklist.map((item) => {
                const shared = sharedDocument(item);
                const title = shared?.name || item.label;
                return (
                  <li key={item.id}>
                    <Link
                      href={`/applications/${application.id}/materials/${item.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl px-1 py-2 text-[15px] text-zinc-800 transition-colors hover:bg-zinc-50"
                    >
                      <span className="min-w-0">
                        <span className="block">{title}</span>
                        {shared ? (
                          <span className="mt-0.5 block text-sm text-zinc-500">
                            {displayCategory(shared.category)}
                            {shared.note?.trim() ? ` · ${shared.note.trim()}` : ""}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-zinc-300">›</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {application.checklist.length > 0 && !isAddingMaterial ? (
            <button
              type="button"
              onClick={() => setIsAddingMaterial(true)}
              className={`mt-3 ${quietButtonClass}`}
            >
              添加材料
            </button>
          ) : null}

          {isAddingMaterial ? (
            <div className="mt-4">
              <label htmlFor="new-material" className={labelClass}>
                材料名称
              </label>
              <input
                id="new-material"
                type="text"
                value={materialDraft}
                onChange={(event) => setMaterialDraft(event.target.value)}
                placeholder="例如：成绩单、雅思或护照"
                className={fieldClass}
                autoFocus
              />
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingMaterial(false);
                    setMaterialDraft("");
                  }}
                  className={secondaryButtonClass}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={saveMaterial}
                  className={primaryButtonClass}
                >
                  保存
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <NotesSection
          notes={application.notes}
          onAdd={addNote}
          onEdit={editNote}
          onDelete={deleteNote}
        />

        <section aria-labelledby="program-info-title" className={cardClass}>
          <h2 id="program-info-title" className={cardTitleClass}>
            官方信息
          </h2>
          <dl className="mt-5 space-y-5">
            <EditableValue
              label="官方网站"
              value={application.website}
              href={href}
              inputType="url"
              placeholder="例如：https://sociology.hku.hk/"
              onSave={(value) => saveField("website", value)}
            />
            <EditableValue
              label="学费"
              value={application.tuition}
              placeholder="例如：待官网公布"
              onSave={(value) => saveField("tuition", value)}
            />
            <EditableValue
              label="学制"
              value={application.duration}
              placeholder="例如：全日制1年"
              onSave={(value) => saveField("duration", value)}
            />
            <EditableValue
              label="语言要求"
              value={application.languageRequirement}
              placeholder="例如：雅思 6.5"
              onSave={(value) => saveField("languageRequirement", value)}
            />
          </dl>
        </section>
      </div>
    </div>
  );
}
