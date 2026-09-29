"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCommonDocuments } from "@/app/common-documents-context";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400";

const labelClassName =
  "text-xs font-medium uppercase tracking-wide text-zinc-400";

function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export default function CommonDocumentDetailPage() {
  const params = useParams<{ documentId: string }>();
  const { getDocument, addDocumentVersion } = useCommonDocuments();
  const document = getDocument(params.documentId);
  const [isAddVersionOpen, setIsAddVersionOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [note, setNote] = useState("");
  const titleId = useId();

  function closeAddVersion() {
    setIsAddVersionOpen(false);
    setFileName("");
    setNote("");
  }

  function saveVersion() {
    if (!document || !fileName.trim()) return;

    addDocumentVersion(document.id, {
      fileName: fileName.trim(),
      date: new Date().toISOString().slice(0, 10),
      note: note.trim() || undefined,
    });
    closeAddVersion();
  }

  if (!document) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f5f5f7] px-6 py-16">
        <p className="text-lg text-zinc-600">Document not found.</p>
        <Link
          href="/common-documents"
          className="mt-6 text-sm font-medium text-zinc-900 hover:underline"
        >
          ← Back to Common Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:px-8 sm:py-14">
        <Link
          href="/common-documents"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800"
        >
          ← Back to Common Documents
        </Link>

        <div className="mt-6">
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
            {document.category}
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            {document.name}
          </h1>
          {document.note ? (
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">
              {document.note}
            </p>
          ) : null}
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
              Versions
            </h2>
            <button
              type="button"
              onClick={() => setIsAddVersionOpen(true)}
              className="shrink-0 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
            >
              + Add Version
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            {document.versions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-10 text-center text-[15px] text-zinc-500">
                No versions yet. Add a file placeholder to get started.
              </p>
            ) : (
              document.versions.map((version) => (
                <article
                  key={version.id}
                  className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {version.fileName}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatDate(version.date)}
                  </p>
                  {version.note ? (
                    <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">
                      {version.note}
                    </p>
                  ) : null}
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-white text-xs font-semibold text-zinc-400 shadow-sm">
                      FILE
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-800">
                        {version.fileName}
                      </p>
                      <p className="text-xs text-zinc-400">
                        Placeholder — upload coming soon
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {isAddVersionOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8 backdrop-blur-sm sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={closeAddVersion}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id={titleId}
              className="text-xl font-semibold tracking-tight text-zinc-900"
            >
              Add Version
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="version-file" className={labelClassName}>
                  File name
                </label>
                <input
                  id="version-file"
                  type="text"
                  value={fileName}
                  onChange={(event) => setFileName(event.target.value)}
                  placeholder="e.g. IELTS_2026.pdf"
                  className={fieldClassName}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="version-note" className={labelClassName}>
                  Note
                </label>
                <textarea
                  id="version-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional note"
                  rows={3}
                  className={`${fieldClassName} resize-none`}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={closeAddVersion}
                className="flex-1 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveVersion}
                className="flex-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Add Version
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
