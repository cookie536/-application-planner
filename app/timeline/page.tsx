"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  createId,
  useApplications,
  type Application,
  type ApplicationNote,
  type ChecklistItem,
} from "@/app/applications-context";
import {
  eventTime,
  type TimelineEvent,
} from "@/app/timeline-events";
import { DEFAULT_STATUSES, displayStatus } from "@/app/ui-copy";
import {
  areaClass,
  cardClass,
  chipClass,
  chipSelectedClass,
  dangerButtonClass,
  dialogBodyClass,
  dialogClass,
  dialogFooterClass,
  EmptyState,
  fieldClass,
  labelClass,
  leadClass,
  overlayClass,
  pageClass,
  primaryButtonClass,
  quietButtonClass,
  secondaryButtonClass,
  shellClass,
  statusPillClass,
  titleClass,
} from "@/app/ui";

type EditDraft = {
  school: string;
  program: string;
  status: string;
  deadline: string;
  checklist: ChecklistItem[];
  notes: string;
  useCustomStatus: boolean;
  customStatus: string;
};

const TIMELINE_GROUPS = ["更早", "今天", "本周", "本月", "即将到来"] as const;

type TimelineGroup = (typeof TIMELINE_GROUPS)[number];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatEventDate(date: string) {
  const time = eventTime(date);
  if (time === null) return date;
  const parsed = new Date(time);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysRemainingLabel(date: string, now = new Date()) {
  const time = eventTime(date);
  if (time === null) return "未填写";
  const diff = Math.round(
    (startOfDay(new Date(time)).getTime() - startOfDay(now).getTime()) /
      86_400_000,
  );
  if (diff === 0) return "今天截止";
  if (diff > 0) return `还有${diff}天`;
  return `已逾期${Math.abs(diff)}天`;
}

function timelineGroup(date: string, now = new Date()): TimelineGroup | null {
  const time = eventTime(date);
  if (time === null) return null;

  const day = startOfDay(new Date(time)).getTime();
  const today = startOfDay(now);
  const todayTime = today.getTime();
  const weekday = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - (weekday === 0 ? 6 : weekday - 1));
  const weekEnd = weekStart.getTime() + 7 * 86_400_000;
  const nextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
  ).getTime();

  if (day === todayTime) return "今天";
  if (day > todayTime && day < weekEnd) return "本周";
  if (day >= weekEnd && day < nextMonth) return "本月";
  if (day >= nextMonth) return "即将到来";
  return "更早";
}

function groupTimelineEvents(events: TimelineEvent<Application>[]) {
  const buckets = new Map<TimelineGroup, TimelineEvent<Application>[]>(
    TIMELINE_GROUPS.map((group) => [group, []]),
  );

  for (const event of events) {
    const group = timelineGroup(event.date);
    if (!group) continue;
    buckets.get(group)?.push(event);
  }

  return TIMELINE_GROUPS.flatMap((label) => {
    const grouped = buckets.get(label) ?? [];
    return grouped.length > 0 ? [{ label, events: grouped }] : [];
  });
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function suggestedMilestoneDate(before?: string, after?: string) {
  const beforeTime = before ? eventTime(before) : null;
  const afterTime = after ? eventTime(after) : null;

  if (beforeTime !== null && afterTime !== null) {
    return toDateInputValue(new Date((beforeTime + afterTime) / 2));
  }
  if (afterTime !== null) {
    const date = new Date(afterTime);
    date.setDate(date.getDate() - 1);
    return toDateInputValue(date);
  }
  if (beforeTime !== null) {
    const date = new Date(beforeTime);
    date.setDate(date.getDate() + 1);
    return toDateInputValue(date);
  }
  return toDateInputValue(new Date());
}

function notesAfterEdit(
  current: ApplicationNote[],
  draftNotes: string,
): ApplicationNote[] {
  const nextText = draftNotes.trim();
  const previousText = current.map((note) => note.text).join("\n\n");
  if (nextText === previousText) return current;
  if (!nextText) return [];
  return [
    {
      id: createId("note"),
      text: nextText,
      createdAt: new Date().toISOString(),
    },
  ];
}

function toEditDraft(app: Application): EditDraft {
  const status = displayStatus(app.status);
  const isDefault = (DEFAULT_STATUSES as readonly string[]).includes(status);

  return {
    school: app.school,
    program: app.program,
    status,
    deadline: app.deadline,
    checklist: app.checklist.map((item) => ({
      ...item,
      versions: item.versions.map((version) => ({ ...version })),
    })),
    notes: app.notes.map((note) => note.text).join("\n\n"),
    useCustomStatus: !isDefault,
    customStatus: isDefault ? "" : status,
  };
}

function InsertSlot({
  onAdd,
  label,
}: {
  onAdd: () => void;
  label: string;
}) {
  return (
    <li className="relative py-1">
      <button
        type="button"
        onClick={onAdd}
        aria-label={label}
        className="flex w-full items-center gap-2 py-1 text-left text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-700"
      >
        <span
          className="absolute -left-[39px] flex size-4 items-center justify-center rounded-full border border-zinc-300 bg-[#f5f5f7] text-[11px] leading-none text-zinc-500"
          aria-hidden="true"
        >
          +
        </span>
        添加节点
      </button>
    </li>
  );
}

export default function TimelinePage() {
  const { timelineEvents, addMilestone, updateApplication, hasHydrated } =
    useApplications();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const addTitleId = useId();
  const editTitleId = useId();

  function openAddMilestone(suggestedDate: string) {
    setTitle("");
    setDate(suggestedDate);
    setIsAddOpen(true);
  }

  function closeAddMilestone() {
    setIsAddOpen(false);
    setTitle("");
    setDate("");
  }

  function saveMilestone() {
    const nextTitle = title.trim();
    if (!nextTitle || !date) return;
    addMilestone({ title: nextTitle, date });
    closeAddMilestone();
  }

  function openEdit(app: Application) {
    setEditingApp(app);
    setDraft(toEditDraft(app));
  }

  function closeEdit() {
    setEditingApp(null);
    setDraft(null);
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

  function saveEdit() {
    if (!editingApp || !draft) return;

    const nextStatus = draft.useCustomStatus
      ? draft.customStatus.trim()
      : draft.status;

    if (!nextStatus) return;

    updateApplication(editingApp.id, (app) => ({
      ...app,
      school: draft.school.trim(),
      program: draft.program.trim(),
      status: nextStatus,
      deadline: draft.deadline,
      notes: notesAfterEdit(app.notes, draft.notes),
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

  if (!hasHydrated) {
    return <div className={pageClass} />;
  }

  return (
    <div className={pageClass}>
      <div className={shellClass}>
        <header>
          <h1 className={titleClass}>时间轴</h1>
          <p className={leadClass}>按日期排列申请截止日期与节点。</p>
        </header>

        {timelineEvents.some((event) => event.type === "application") ? null : (
          <div className="mt-8">
            <EmptyState
              title="暂无时间节点"
              description="在申请详情里填写截止日期后，会出现在这里。"
              action={
                <Link href="/dashboard" className={primaryButtonClass}>
                  新增申请
                </Link>
              }
            />
          </div>
        )}

        {groupTimelineEvents(timelineEvents).map((group) => (
          <section key={group.label} className="mt-10">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-500">
              {group.label}
            </h2>
            <ol className="relative mt-5 border-l border-zinc-200 pl-8">
              <InsertSlot
                label={`在${group.label}的第一个事件前添加节点`}
                onAdd={() =>
                  openAddMilestone(
                    suggestedMilestoneDate(undefined, group.events[0]?.date),
                  )
                }
              />
              {group.events.flatMap((event, index) => [
                <li key={event.id} className="relative pb-4">
                  <span
                    className="absolute -left-[37px] top-5 size-2.5 rounded-full bg-zinc-900"
                    aria-hidden="true"
                  />
                  {event.type === "application" ? (
                    <button
                      type="button"
                      onClick={() => openEdit(event.application)}
                      className={`${cardClass} w-full text-left`}
                    >
                      <p className="text-sm font-semibold text-zinc-950">
                        {formatEventDate(event.date)}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
                        {[event.application.school, event.application.program]
                          .filter(Boolean)
                          .join(" ") || "未填写"}
                      </h3>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span
                          className={`inline-flex h-7 items-center rounded-full px-2.5 text-sm font-medium ${statusPillClass(displayStatus(event.application.status))}`}
                        >
                          {displayStatus(event.application.status)}
                        </span>
                        <p className="text-sm text-zinc-500">
                          {daysRemainingLabel(event.date)}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div className={cardClass}>
                      <p className="text-sm font-semibold text-zinc-950">
                        {formatEventDate(event.date)}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
                        {event.title}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-500">节点</p>
                    </div>
                  )}
                </li>,
                <InsertSlot
                  key={`insert-after-${event.id}`}
                  label={`在${formatEventDate(event.date)}之后添加节点`}
                  onAdd={() =>
                    openAddMilestone(
                      suggestedMilestoneDate(
                        event.date,
                        group.events[index + 1]?.date,
                      ),
                    )
                  }
                />,
              ])}
            </ol>
          </section>
        ))}
      </div>

      {isAddOpen ? (
        <div
          className={overlayClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby={addTitleId}
          onClick={closeAddMilestone}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.16)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id={addTitleId}
              className="text-xl font-semibold tracking-tight text-zinc-900"
            >
              添加节点
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="milestone-title" className={labelClass}>
                  标题
                </label>
                <input
                  id="milestone-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="例如：发出推荐信请求"
                  className={fieldClass}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="milestone-date" className={labelClass}>
                  日期
                </label>
                <input
                  id="milestone-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={closeAddMilestone}
                className={`${secondaryButtonClass} flex-1`}
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveMilestone}
                className={`${primaryButtonClass} flex-1`}
              >
                添加节点
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingApp && draft ? (
        <div
          className={overlayClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby={editTitleId}
          onClick={closeEdit}
        >
          <div
            className={dialogClass}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={dialogBodyClass}>
              <h2
                id={editTitleId}
                className="text-xl font-semibold tracking-tight text-zinc-900"
              >
                编辑申请
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="timeline-school" className={labelClass}>
                    学校
                  </label>
                  <input
                    id="timeline-school"
                    type="text"
                    value={draft.school}
                    onChange={(event) =>
                      updateDraft({ school: event.target.value })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="timeline-program" className={labelClass}>
                    项目
                  </label>
                  <input
                    id="timeline-program"
                    type="text"
                    value={draft.program}
                    onChange={(event) =>
                      updateDraft({ program: event.target.value })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="timeline-deadline" className={labelClass}>
                    截止日期
                  </label>
                  <input
                    id="timeline-deadline"
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
                  <p className={labelClass}>材料</p>
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

                <div>
                  <label htmlFor="timeline-notes" className={labelClass}>
                    备注
                  </label>
                  <textarea
                    id="timeline-notes"
                    value={draft.notes}
                    onChange={(event) =>
                      updateDraft({ notes: event.target.value })
                    }
                    rows={3}
                    placeholder="选填备注"
                    className={areaClass}
                  />
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
                onClick={saveEdit}
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
