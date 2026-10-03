"use client";

import { useEffect, useRef, useState } from "react";
import {
  addLibraryFile,
  deleteLibraryFile,
  downloadLibraryFile,
  LIBRARY_FILE_TYPES,
  libraryFileType,
  listLibraryFiles,
  openLibraryFile,
  renameLibraryFile,
  type LibraryFile,
} from "@/app/document-library";
import {
  cardClass,
  dangerButtonClass,
  EmptyState,
  fieldClass,
  labelClass,
  leadClass,
  pageClass,
  primaryButtonClass,
  secondaryButtonClass,
  shellWideClass,
  titleClass,
} from "@/app/ui";

const acceptTypes = LIBRARY_FILE_TYPES.map((type) => `.${type.toLowerCase()}`).join(
  ",",
);

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUpdated(updatedAt: string) {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return updatedAt;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-8 text-zinc-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 3.5h6.5L19 9v11.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1z" />
      <path d="M13.5 3.5V9H19" />
    </svg>
  );
}

export default function DocumentsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    listLibraryFiles()
      .then((stored) => {
        if (!cancelled) setFiles(stored);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh() {
    setFiles(await listLibraryFiles());
  }

  function chooseFiles() {
    inputRef.current?.click();
  }

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    let rejected = false;
    for (const file of Array.from(list)) {
      if (!libraryFileType(file.name)) {
        rejected = true;
        continue;
      }
      await addLibraryFile(file);
    }
    setNotice(
      rejected ? "仅支持 PDF、DOCX、DOC、JPG、PNG、JPEG 和 XLSX。" : "",
    );
    if (inputRef.current) inputRef.current.value = "";
    await refresh();
  }

  async function saveRename(id: string) {
    const name = renameDraft.trim();
    if (!name) return;
    await renameLibraryFile(id, name);
    setRenamingId(null);
    setRenameDraft("");
    await refresh();
  }

  async function removeFile(id: string) {
    await deleteLibraryFile(id);
    if (renamingId === id) {
      setRenamingId(null);
      setRenameDraft("");
    }
    await refresh();
  }

  if (!ready) {
    return <div className={pageClass} />;
  }

  return (
    <div className={pageClass}>
      <div className={shellWideClass}>
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className={titleClass}>文件库</h1>
            <p className={leadClass}>文件只保存在这台浏览器里。</p>
          </div>
          {files.length > 0 ? (
            <button type="button" onClick={chooseFiles} className={primaryButtonClass}>
              上传文件
            </button>
          ) : null}
        </header>

        <input
          ref={inputRef}
          type="file"
          accept={acceptTypes}
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        {notice ? <p className="mt-4 text-sm text-zinc-500">{notice}</p> : null}

        {files.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="暂无文件"
              action={
                <button
                  type="button"
                  onClick={chooseFiles}
                  className={primaryButtonClass}
                >
                  上传第一个文件
                </button>
              }
            />
          </div>
        ) : (
          <section className="mt-8 grid gap-4 sm:grid-cols-2">
            {files.map((file) => (
              <article key={file.id} className={cardClass}>
                <div className="flex items-start gap-3">
                  <FileIcon />
                  <div className="min-w-0 flex-1">
                    {renamingId === file.id ? (
                      <div>
                        <label htmlFor={`rename-${file.id}`} className={labelClass}>
                          文件名称
                        </label>
                        <input
                          id={`rename-${file.id}`}
                          type="text"
                          value={renameDraft}
                          onChange={(event) => setRenameDraft(event.target.value)}
                          className={fieldClass}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <h2 className="truncate text-[15px] font-semibold text-zinc-950">
                        {file.name}
                      </h2>
                    )}
                    <p className="mt-1 text-sm text-zinc-500">{formatSize(file.size)}</p>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      更新于 {formatUpdated(file.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {renamingId === file.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingId(null);
                          setRenameDraft("");
                        }}
                        className={secondaryButtonClass}
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={() => saveRename(file.id)}
                        className={primaryButtonClass}
                      >
                        保存
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openLibraryFile(file)}
                        className={secondaryButtonClass}
                      >
                        打开
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingId(file.id);
                          setRenameDraft(file.name);
                        }}
                        className={secondaryButtonClass}
                      >
                        重命名
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadLibraryFile(file)}
                        className={secondaryButtonClass}
                      >
                        下载
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className={`${dangerButtonClass} inline-flex h-10 items-center px-3`}
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
