"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  DOCUMENT_CATEGORIES,
  useCommonDocuments,
  type CommonDocument,
} from "@/app/common-documents-context";
import { displayCategory } from "@/app/ui-copy";
import {
  areaClass,
  backLinkClass,
  cardClass,
  dangerButtonClass,
  EmptyState,
  fieldClass,
  labelClass,
  leadClass,
  overlayClass,
  pageClass,
  primaryButtonClass,
  secondaryButtonClass,
  shellWideClass,
  titleClass,
} from "@/app/ui";

type DocumentFormState = {
  name: string;
  category: string;
  note: string;
};

const emptyForm: DocumentFormState = {
  name: "",
  category: "其他",
  note: "",
};

function formatDate(date?: string) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export default function CommonDocumentsPage() {
  const {
    documents,
    hasHydrated,
    addDocument,
    updateDocument,
    deleteDocument,
  } = useCommonDocuments();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CommonDocument | null>(null);
  const [form, setForm] = useState<DocumentFormState>(emptyForm);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const formTitleId = useId();

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

  function openAdd() {
    setEditingDoc(null);
    setForm(emptyForm);
    setIsAddOpen(true);
  }

  function openEdit(doc: CommonDocument) {
    setOpenMenuId(null);
    setEditingDoc(doc);
    setForm({
      name: doc.name,
      category: displayCategory(doc.category),
      note: doc.note ?? "",
    });
    setIsAddOpen(true);
  }

  function closeForm() {
    setIsAddOpen(false);
    setEditingDoc(null);
    setForm(emptyForm);
  }

  function saveForm() {
    const name = form.name.trim();
    if (!name) return;

    if (editingDoc) {
      updateDocument(editingDoc.id, {
        name,
        category: form.category,
        note: form.note.trim() || undefined,
      });
    } else {
      addDocument({
        name,
        category: form.category,
        note: form.note.trim() || undefined,
        uploadDate: new Date().toISOString().slice(0, 10),
      });
    }
    closeForm();
  }

  if (!hasHydrated) {
    return <div className={pageClass} />;
  }

  return (
    <div className={pageClass}>
      <div className={shellWideClass}>
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link href="/dashboard" className={backLinkClass}>
              ← 主页
            </Link>
            <h1 className={`mt-3 ${titleClass}`}>通用材料</h1>
            <p className={leadClass}>可在多份申请中复用的材料</p>
          </div>
          {documents.length > 0 ? (
            <button type="button" onClick={openAdd} className={primaryButtonClass}>
              添加材料
            </button>
          ) : null}
        </header>

        <section className="mt-8 grid gap-4">
          {documents.length === 0 ? (
            <EmptyState
              title="暂无材料"
              description="添加成绩单、语言成绩或护照。关联后的申请会显示这里的最新内容。"
              action={
                <button type="button" onClick={openAdd} className={primaryButtonClass}>
                  添加材料
                </button>
              }
            />
          ) : (
            documents.map((doc) => (
              <article
                key={doc.id}
                className={`relative ${cardClass}`}
              >
                <div
                  className="absolute right-4 top-4"
                  ref={openMenuId === doc.id ? menuRef : undefined}
                >
                  <button
                    type="button"
                    aria-label={`${doc.name}选项`}
                    aria-expanded={openMenuId === doc.id}
                    aria-haspopup="menu"
                    onClick={() =>
                      setOpenMenuId((current) =>
                        current === doc.id ? null : doc.id,
                      )
                    }
                    className="flex size-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                  >
                    <span className="text-lg leading-none tracking-widest">
                      ···
                    </span>
                  </button>

                  {openMenuId === doc.id ? (
                    <div
                      role="menu"
                      className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => openEdit(doc)}
                        className="block w-full px-3.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-50"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuId(null);
                          deleteDocument(doc.id);
                        }}
                        className={`block w-full px-3.5 py-2.5 text-left ${dangerButtonClass} hover:bg-red-50`}
                      >
                        删除
                      </button>
                    </div>
                  ) : null}
                </div>

                <Link
                  href={`/common-documents/${doc.id}`}
                  className="block pr-10"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-zinc-900 hover:underline">
                      {doc.name}
                    </h2>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                      {displayCategory(doc.category)}
                    </span>
                  </div>
                  {doc.note ? (
                    <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
                      {doc.note}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm text-zinc-400">
                    {formatDate(doc.uploadDate)
                      ? `${formatDate(doc.uploadDate)} 上传`
                      : "暂无上传日期"}
                    {" · "}
                    {doc.versions.length} 个版本
                  </p>
                </Link>
              </article>
            ))
          )}
        </section>
      </div>

      {isAddOpen ? (
        <div
          className={overlayClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby={formTitleId}
          onClick={closeForm}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.16)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id={formTitleId}
              className="text-xl font-semibold tracking-tight text-zinc-900"
            >
              {editingDoc ? "编辑材料" : "添加材料"}
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="doc-name" className={labelClass}>
                  材料名称
                </label>
                <input
                  id="doc-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="例如：成绩单"
                  className={fieldClass}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="doc-category" className={labelClass}>
                  分类
                </label>
                <select
                  id="doc-category"
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      category: event.target.value,
                    }))
                  }
                  className={fieldClass}
                >
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="doc-note" className={labelClass}>
                  备注
                </label>
                <textarea
                  id="doc-note"
                  value={form.note}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                  placeholder="选填备注"
                  rows={3}
                  className={areaClass}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={closeForm}
                className={`${secondaryButtonClass} flex-1`}
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveForm}
                className={`${primaryButtonClass} flex-1`}
              >
                {editingDoc ? "保存" : "添加材料"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
