"use client";

import { useState } from "react";
import type { ApplicationNote } from "@/app/applications-context";
import {
  areaClass,
  cardClass,
  cardTitleClass,
  dangerButtonClass,
  primaryButtonClass,
  quietButtonClass,
  secondaryButtonClass,
} from "@/app/ui";

function formatCreatedAt(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function NotesSection({
  notes,
  onAdd,
  onEdit,
  onDelete,
}: {
  notes: ApplicationNote[];
  onAdd: (text: string) => void;
  onEdit: (noteId: string, text: string) => void;
  onDelete: (noteId: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  function startAdd() {
    setEditingId(null);
    setEditDraft("");
    setDraft("");
    setIsAdding(true);
  }

  function cancelAdd() {
    setIsAdding(false);
    setDraft("");
  }

  function saveAdd() {
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft("");
    setIsAdding(false);
  }

  function startEdit(note: ApplicationNote) {
    setIsAdding(false);
    setDraft("");
    setEditingId(note.id);
    setEditDraft(note.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  function saveEdit() {
    if (!editingId) return;
    const text = editDraft.trim();
    if (!text) return;
    onEdit(editingId, text);
    setEditingId(null);
    setEditDraft("");
  }

  return (
    <section aria-labelledby="notes-title" className={cardClass}>
      <div className="flex items-center justify-between gap-4">
        <h2 id="notes-title" className={cardTitleClass}>
          备注
        </h2>
        {notes.length > 0 && !isAdding ? (
          <button type="button" onClick={startAdd} className={quietButtonClass}>
            添加备注
          </button>
        ) : null}
      </div>

      {notes.length === 0 && !isAdding ? (
        <div className="mt-6 text-center">
          <p className="text-[15px] text-zinc-500">暂无备注</p>
          <button
            type="button"
            onClick={startAdd}
            className={`${primaryButtonClass} mt-5`}
          >
            添加第一条备注
          </button>
        </div>
      ) : notes.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl bg-zinc-50 px-4 py-3">
              {editingId === note.id ? (
                <div>
                  <textarea
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                    rows={3}
                    className={`${areaClass} mt-0 bg-white`}
                    aria-label="编辑备注"
                    autoFocus
                  />
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className={secondaryButtonClass}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className={primaryButtonClass}
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[15px] leading-relaxed text-zinc-800">
                    {note.text}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">
                    {formatCreatedAt(note.createdAt)}
                  </p>
                  <div className="mt-2 flex gap-4">
                    <button
                      type="button"
                      onClick={() => startEdit(note)}
                      className={quietButtonClass}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(note.id)}
                      className={dangerButtonClass}
                    >
                      删除
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {isAdding ? (
        <div className="mt-5">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="写下一条备注"
            className={`${areaClass} mt-0`}
            aria-label="新备注"
            autoFocus
          />
          <div className="mt-3 flex gap-3">
            <button type="button" onClick={cancelAdd} className={secondaryButtonClass}>
              取消
            </button>
            <button type="button" onClick={saveAdd} className={primaryButtonClass}>
              添加
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
