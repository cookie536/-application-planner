"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  DOCUMENT_CATEGORIES,
  useCommonDocuments,
  type CommonDocument,
} from "@/app/common-documents-context";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400";

const labelClassName =
  "text-xs font-medium uppercase tracking-wide text-zinc-400";

type DocumentFormState = {
  name: string;
  category: string;
  note: string;
};

const emptyForm: DocumentFormState = {
  name: "",
  category: "Other",
  note: "",
};

function formatDate(date?: string) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export default function CommonDocumentsPage() {
  const { documents, addDocument, updateDocument, deleteDocument } =
    useCommonDocuments();
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
      category: doc.category,
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

  return (
    <div className="flex flex-1 flex-col bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-8 sm:py-14">
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Common Documents
            </h1>
            <p className="mt-2 text-[15px] text-zinc-500">
              通用材料库 — reusable documents across applications
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="shrink-0 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
          >
            + Add Document
          </button>
        </header>

        <section className="mt-10 grid gap-4">
          {documents.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-[15px] text-zinc-500">
              No common documents yet. Add your first reusable document.
            </p>
          ) : (
            documents.map((doc) => (
              <article
                key={doc.id}
                className="relative rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] sm:p-6"
              >
                <div
                  className="absolute right-4 top-4"
                  ref={openMenuId === doc.id ? menuRef : undefined}
                >
                  <button
                    type="button"
                    aria-label={`${doc.name} options`}
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
                      className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => openEdit(doc)}
                        className="block w-full px-3.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpenMenuId(null);
                          deleteDocument(doc.id);
                        }}
                        className="block w-full px-3.5 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        Delete
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
                      {doc.category}
                    </span>
                  </div>
                  {doc.note ? (
                    <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
                      {doc.note}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm text-zinc-400">
                    {formatDate(doc.uploadDate)
                      ? `Uploaded ${formatDate(doc.uploadDate)}`
                      : "No upload date"}
                    {" · "}
                    {doc.versions.length} version
                    {doc.versions.length === 1 ? "" : "s"}
                  </p>
                </Link>
              </article>
            ))
          )}
        </section>
      </div>

      {isAddOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8 backdrop-blur-sm sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={formTitleId}
          onClick={closeForm}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id={formTitleId}
              className="text-xl font-semibold tracking-tight text-zinc-900"
            >
              {editingDoc ? "Edit Document" : "Add Document"}
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="doc-name" className={labelClassName}>
                  Document name
                </label>
                <input
                  id="doc-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="e.g. Transcript"
                  className={fieldClassName}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="doc-category" className={labelClassName}>
                  Category
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
                  className={fieldClassName}
                >
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="doc-note" className={labelClassName}>
                  Note
                </label>
                <textarea
                  id="doc-note"
                  value={form.note}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, note: event.target.value }))
                  }
                  placeholder="Optional note"
                  rows={3}
                  className={`${fieldClassName} resize-none`}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveForm}
                className="flex-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                {editingDoc ? "Save Changes" : "Add Document"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
