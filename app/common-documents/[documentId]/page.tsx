"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCommonDocuments } from "@/app/common-documents-context";
import { displayCategory } from "@/app/ui-copy";
import {
  areaClass,
  backLinkClass,
  cardClass,
  cardTitleClass,
  fieldClass,
  labelClass,
  leadClass,
  overlayClass,
  pageClass,
  primaryButtonClass,
  secondaryButtonClass,
  shellClass,
  titleClass,
} from "@/app/ui";

function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export default function CommonDocumentDetailPage() {
  const params = useParams<{ documentId: string }>();
  const { getDocument, addDocumentVersion, hasHydrated } = useCommonDocuments();
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

  if (!hasHydrated) {
    return <div className={pageClass} />;
  }

  if (!document) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f5f5f7] px-6 py-16">
        <p className="text-lg text-zinc-600">未找到该材料。</p>
        <Link href="/common-documents" className={`${primaryButtonClass} mt-6`}>
          返回通用材料
        </Link>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <div className={`${shellClass} flex flex-col gap-4`}>
        <header>
          <Link href="/common-documents" className={backLinkClass}>
            ← 返回通用材料
          </Link>
          <span className="mt-4 inline-flex h-7 items-center rounded-full bg-zinc-100 px-2.5 text-sm font-medium text-zinc-600">
            {displayCategory(document.category)}
          </span>
          <h1 className={`mt-3 ${titleClass}`}>{document.name}</h1>
          {document.note ? <p className={leadClass}>{document.note}</p> : null}
        </header>

        <section className={cardClass}>
          <div className="flex items-center justify-between gap-4">
            <h2 className={cardTitleClass}>版本</h2>
            {document.versions.length > 0 ? (
              <button
                type="button"
                onClick={() => setIsAddVersionOpen(true)}
                className={primaryButtonClass}
              >
                添加版本
              </button>
            ) : null}
          </div>

          {document.versions.length === 0 ? (
            <div className="mt-6 text-center">
              <p className="text-[15px] text-zinc-500">暂无版本。添加第一条版本记录。</p>
              <button
                type="button"
                onClick={() => setIsAddVersionOpen(true)}
                className={`${primaryButtonClass} mt-5`}
              >
                添加版本
              </button>
            </div>
          ) : (
            <ol className="relative mt-5 border-l border-zinc-200 pl-6">
              {document.versions.map((version) => (
                <li key={version.id} className="relative pb-6 last:pb-0">
                  <span
                    className="absolute -left-[29px] top-1.5 size-2.5 rounded-full bg-zinc-900"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium text-zinc-500">
                    {formatDate(version.date)}
                  </p>
                  <h3 className="mt-1 text-[15px] font-semibold text-zinc-950">
                    {version.fileName}
                  </h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-zinc-600">
                    {version.note?.trim() || "未填写"}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {isAddVersionOpen ? (
        <div
          className={overlayClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={closeAddVersion}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.16)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id={titleId}
              className="text-xl font-semibold tracking-tight text-zinc-900"
            >
              添加版本
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="version-file" className={labelClass}>
                  文件名
                </label>
                <input
                  id="version-file"
                  type="text"
                  value={fileName}
                  onChange={(event) => setFileName(event.target.value)}
                  placeholder="例如：成绩单.pdf"
                  className={fieldClass}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="version-note" className={labelClass}>
                  备注
                </label>
                <textarea
                  id="version-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="选填备注"
                  rows={3}
                  className={areaClass}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={closeAddVersion}
                className={`${secondaryButtonClass} flex-1`}
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveVersion}
                className={`${primaryButtonClass} flex-1`}
              >
                添加版本
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
