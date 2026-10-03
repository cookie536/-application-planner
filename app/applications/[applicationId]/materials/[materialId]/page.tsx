"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  createId,
  isCommonLinkedMaterial,
  MATERIAL_STATUSES,
  useApplications,
  type MaterialSource,
} from "@/app/applications-context";
import { NotesSection } from "@/app/applications/[applicationId]/notes-section";
import { useCommonDocuments } from "@/app/common-documents-context";
import {
  downloadLibraryFile,
  getLibraryFile,
  listLibraryFiles,
  openLibraryFile,
  subscribeLibraryChanges,
  type LibraryFile,
} from "@/app/document-library";
import { displayCategory } from "@/app/ui-copy";
import {
  areaClass,
  backLinkClass,
  cardClass,
  cardTitleClass,
  chipClass,
  chipSelectedClass,
  fieldClass,
  labelClass,
  overlayClass,
  pageClass,
  primaryButtonClass,
  secondaryButtonClass,
  shellClass,
  statusPillClass,
  titleClass,
} from "@/app/ui";

function formatVersionDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function friendlyVersionLabel(fileName: string) {
  return fileName.replace(/\.pdf$/i, "").replace(/_/g, " ");
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFileUpdated(updatedAt: string) {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return updatedAt;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function MaterialWorkspacePage() {
  const params = useParams<{
    applicationId: string;
    materialId: string;
  }>();
  const {
    getMaterial,
    hasHydrated,
    addMaterialVersion,
    updateMaterial,
    linkMaterialToCommonDocument,
    unlinkMaterialFromCommonDocument,
  } = useApplications();
  const { documents, getDocumentVersion, hasHydrated: documentsHydrated } =
    useCommonDocuments();
  const [isAddVersionOpen, setIsAddVersionOpen] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [versionNote, setVersionNote] = useState("");
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [isChangingLink, setIsChangingLink] = useState(false);
  const [draftDocumentId, setDraftDocumentId] = useState("");
  const [draftVersionId, setDraftVersionId] = useState("");
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([]);
  const [linkedFile, setLinkedFile] = useState<LibraryFile | null>(null);
  const titleId = useId();
  const filePickerTitleId = useId();

  const result = getMaterial(params.applicationId, params.materialId);
  const linkedDocumentId = result?.material.documentId;
  const applicationId = result?.application.id;
  const materialItemId = result?.material.id;

  useEffect(() => {
    if (!hasHydrated) return;
    let cancelled = false;

    async function loadLinkedFile() {
      if (!linkedDocumentId) {
        setLinkedFile(null);
        return;
      }
      try {
        const file = await getLibraryFile(linkedDocumentId);
        if (cancelled) return;
        if (!file) {
          setLinkedFile(null);
          if (applicationId && materialItemId) {
            updateMaterial(applicationId, materialItemId, {
              documentId: undefined,
            });
          }
          return;
        }
        setLinkedFile(file);
      } catch {
        // Keep documentId. The next focus or library change can retry.
      }
    }

    function refreshLinkedFile() {
      void loadLinkedFile();
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") refreshLinkedFile();
    }

    refreshLinkedFile();
    window.addEventListener("focus", refreshLinkedFile);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const unsubscribe = subscribeLibraryChanges(refreshLinkedFile);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshLinkedFile);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      unsubscribe();
    };
  }, [
    applicationId,
    hasHydrated,
    linkedDocumentId,
    materialItemId,
    updateMaterial,
  ]);

  const linkedCommon = useMemo(() => {
    if (!result?.material.commonDocumentId || !result.material.versionId) {
      return undefined;
    }
    return getDocumentVersion(
      result.material.commonDocumentId,
      result.material.versionId,
    );
  }, [getDocumentVersion, result]);

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === draftDocumentId),
    [documents, draftDocumentId],
  );

  function closeAddVersion() {
    setIsAddVersionOpen(false);
    setVersionName("");
    setVersionNote("");
  }

  function saveVersion() {
    if (!result || !versionName.trim()) return;

    const fileName = versionName.trim();
    addMaterialVersion(result.application.id, result.material.id, {
      name: fileName,
      date: new Date().toISOString().slice(0, 10),
      note: versionNote.trim() || undefined,
      fileName,
    });
    closeAddVersion();
  }

  function saveName() {
    if (!result) return;
    const next = (nameDraft ?? result.material.label).trim();
    setNameDraft(null);
    if (!next || next === result.material.label) return;
    updateMaterial(result.application.id, result.material.id, { label: next });
  }

  function beginCommonLinking(existingDocumentId?: string, existingVersionId?: string) {
    setIsChangingLink(true);
    setDraftDocumentId(existingDocumentId ?? "");
    setDraftVersionId(existingVersionId ?? "");
  }

  function selectSource(source: MaterialSource) {
    if (!result) return;

    if (source === "project") {
      setIsChangingLink(false);
      unlinkMaterialFromCommonDocument(
        result.application.id,
        result.material.id,
      );
      return;
    }

    updateMaterial(result.application.id, result.material.id, {
      source: "common",
    });

    if (!isCommonLinkedMaterial(result.material)) {
      beginCommonLinking(
        result.material.commonDocumentId,
        result.material.versionId,
      );
    }
  }

  function saveCommonLink() {
    if (!result || !draftDocumentId || !draftVersionId) return;
    linkMaterialToCommonDocument(
      result.application.id,
      result.material.id,
      draftDocumentId,
      draftVersionId,
    );
    setIsChangingLink(false);
  }

  function cancelCommonLinkEdit() {
    setIsChangingLink(false);
    setDraftDocumentId("");
    setDraftVersionId("");
  }

  async function openFilePicker() {
    setLibraryFiles(await listLibraryFiles());
    setIsFilePickerOpen(true);
  }

  function linkLibraryFile(file: LibraryFile) {
    if (!result) return;
    updateMaterial(result.application.id, result.material.id, {
      documentId: file.id,
    });
    setLinkedFile(file);
    setIsFilePickerOpen(false);
  }

  function unlinkLibraryFile() {
    if (!result) return;
    updateMaterial(result.application.id, result.material.id, {
      documentId: undefined,
    });
    setLinkedFile(null);
  }

  if (!hasHydrated || !documentsHydrated) {
    return <div className="flex flex-1 flex-col bg-[#f5f5f7]" />;
  }

  if (!result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f5f5f7] px-6 py-16">
        <p className="text-lg text-zinc-600">未找到该材料。</p>
        <Link href="/dashboard" className={`${primaryButtonClass} mt-6`}>
          返回主页
        </Link>
      </div>
    );
  }

  const { application, material } = result;
  const source: MaterialSource = material.source === "common" ? "common" : "project";
  const isLinked = isCommonLinkedMaterial(material);
  const showCommonPicker =
    source === "common" && (isChangingLink || !isLinked);

  return (
    <div className={pageClass}>
      <div className={`${shellClass} flex flex-col gap-4`}>
        <header>
          <Link href="/dashboard" className={backLinkClass}>
            ← 返回主页
          </Link>
          <p className="mt-4 text-sm text-zinc-500">
            {application.school} · {application.program}
          </p>
          <h1 className={`mt-1 ${titleClass}`}>{material.label}</h1>
        </header>

        <section className={cardClass}>
          <label htmlFor="material-name" className={labelClass}>
            名称
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              id="material-name"
              type="text"
              value={nameDraft ?? material.label}
              onChange={(event) => setNameDraft(event.target.value)}
              className={`${fieldClass} mt-0 min-w-0 flex-1`}
            />
            <button type="button" onClick={saveName} className={primaryButtonClass}>
              保存
            </button>
          </div>
        </section>

        <section className={cardClass}>
          <p className={labelClass}>当前状态</p>
          <p className="mt-3">
            <span
              className={`inline-flex h-9 items-center rounded-full px-3.5 text-base font-semibold ${statusPillClass(material.status)}`}
            >
              {material.status}
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {MATERIAL_STATUSES.map((status) => {
              const selected = material.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    updateMaterial(application.id, material.id, { status })
                  }
                  className={selected ? chipSelectedClass : chipClass}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </section>

        <section className={cardClass}>
          <h2 className={cardTitleClass}>关联文件</h2>
          {linkedFile ? (
            <>
              <dl className="mt-4 space-y-2 text-[15px] text-zinc-700">
                <div className="flex gap-3">
                  <dt className="text-zinc-400">文件名称</dt>
                  <dd className="min-w-0 break-words">{linkedFile.name}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="text-zinc-400">文件大小</dt>
                  <dd>{formatFileSize(linkedFile.size)}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="text-zinc-400">更新时间</dt>
                  <dd>{formatFileUpdated(linkedFile.updatedAt)}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openLibraryFile(linkedFile)}
                  className={secondaryButtonClass}
                >
                  打开
                </button>
                <button
                  type="button"
                  onClick={() => downloadLibraryFile(linkedFile)}
                  className={secondaryButtonClass}
                >
                  下载
                </button>
                <button
                  type="button"
                  onClick={openFilePicker}
                  className={secondaryButtonClass}
                >
                  更换文件
                </button>
                <button
                  type="button"
                  onClick={unlinkLibraryFile}
                  className={secondaryButtonClass}
                >
                  取消关联
                </button>
              </div>
            </>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-[15px] text-zinc-500">未关联文件</p>
              <button
                type="button"
                onClick={openFilePicker}
                className={`${primaryButtonClass} mt-5`}
              >
                选择文件
              </button>
            </div>
          )}
        </section>

        <section className={cardClass}>
          <h2 className={cardTitleClass}>材料来源</h2>
          <p className="mt-2 text-sm text-zinc-500">
            选择此材料为项目专属，或关联通用材料。
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => selectSource("project")}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                source === "project"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <p className="text-sm font-semibold">项目专属材料</p>
              <p
                className={`mt-1 text-xs ${
                  source === "project" ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                仅用于这份申请。
              </p>
            </button>
            <button
              type="button"
              onClick={() => selectSource("common")}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                source === "common"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              <p className="text-sm font-semibold">使用通用材料</p>
              <p
                className={`mt-1 text-xs ${
                  source === "common" ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                引用通用材料中的文件。
              </p>
            </button>
          </div>

          {source === "common" && isLinked && !isChangingLink ? (
            <div className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                已关联通用材料
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {linkedCommon?.document.name ?? "文档已删除或不存在"}
              </p>
              {linkedCommon ? (
                <p className="mt-1 text-sm text-zinc-500">
                  {displayCategory(linkedCommon.document.category)}
                  {linkedCommon.document.note?.trim()
                    ? ` · ${linkedCommon.document.note.trim()}`
                    : ""}
                </p>
              ) : null}
              <p className="mt-1 text-[15px] text-zinc-600">
                版本：
                {linkedCommon
                  ? friendlyVersionLabel(linkedCommon.version.fileName)
                  : material.versionId}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    beginCommonLinking(
                      material.commonDocumentId,
                      material.versionId,
                    )
                  }
                  className={secondaryButtonClass}
                >
                  更换版本
                </button>
                <button
                  type="button"
                  onClick={() =>
                    unlinkMaterialFromCommonDocument(
                      application.id,
                      material.id,
                    )
                  }
                  className={secondaryButtonClass}
                >
                  取消关联
                </button>
              </div>
            </div>
          ) : null}

          {showCommonPicker ? (
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="common-document" className={labelClass}>
                  选择通用材料
                </label>
                <select
                  id="common-document"
                  value={draftDocumentId}
                  onChange={(event) => {
                    setDraftDocumentId(event.target.value);
                    setDraftVersionId("");
                  }}
                  className={fieldClass}
                >
                  <option value="">请选择材料</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>

              {draftDocumentId ? (
                <div>
                  <label htmlFor="common-version" className={labelClass}>
                    选择版本
                  </label>
                  <select
                    id="common-version"
                    value={draftVersionId}
                    onChange={(event) => setDraftVersionId(event.target.value)}
                    className={fieldClass}
                  >
                    <option value="">请选择版本</option>
                    {(selectedDocument?.versions ?? []).map((version) => (
                      <option key={version.id} value={version.id}>
                        {friendlyVersionLabel(version.fileName)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveCommonLink}
                  disabled={!draftDocumentId || !draftVersionId}
                  className={primaryButtonClass}
                >
                  保存关联
                </button>
                {isLinked ? (
                  <button
                    type="button"
                    onClick={cancelCommonLinkEdit}
                    className={secondaryButtonClass}
                  >
                    取消
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        {source === "project" ? (
          <section className={cardClass}>
            <div className="flex items-center justify-between gap-4">
              <h2 className={cardTitleClass}>版本</h2>
              {material.versions.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setIsAddVersionOpen(true)}
                  className={primaryButtonClass}
                >
                  添加版本
                </button>
              ) : null}
            </div>

            {material.versions.length === 0 ? (
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
              <ol className="relative mt-5 space-y-0 border-l border-zinc-200 pl-6">
                {material.versions.map((version) => {
                  const fileName =
                    version.fileName && version.fileName !== "文件占位"
                      ? version.fileName
                      : version.name;
                  return (
                    <li key={version.id} className="relative pb-6 last:pb-0">
                      <span
                        className="absolute -left-[29px] top-1.5 size-2.5 rounded-full bg-zinc-900"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-medium text-zinc-500">
                        {formatVersionDate(version.date)}
                      </p>
                      <h3 className="mt-1 text-[15px] font-semibold text-zinc-950">
                        {fileName}
                      </h3>
                      <p className="mt-1 text-[15px] leading-relaxed text-zinc-600">
                        {version.note?.trim() || "未填写"}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        ) : null}

        <NotesSection
            notes={material.notes ?? []}
            onAdd={(text) =>
              updateMaterial(application.id, material.id, {
                notes: [
                  {
                    id: createId("mnote"),
                    text,
                    createdAt: new Date().toISOString(),
                  },
                  ...(material.notes ?? []),
                ],
              })
            }
            onEdit={(noteId, text) =>
              updateMaterial(application.id, material.id, {
                notes: (material.notes ?? []).map((note) =>
                  note.id === noteId ? { ...note, text } : note,
                ),
              })
            }
            onDelete={(noteId) =>
              updateMaterial(application.id, material.id, {
                notes: (material.notes ?? []).filter(
                  (note) => note.id !== noteId,
                ),
              })
            }
          />
      </div>

      {isFilePickerOpen ? (
        <div
          className={overlayClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby={filePickerTitleId}
          onClick={() => setIsFilePickerOpen(false)}
        >
          <div
            className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_rgba(0,0,0,0.16)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="overflow-y-auto px-6 py-7 sm:px-8">
              <h2
                id={filePickerTitleId}
                className="text-xl font-semibold tracking-tight text-zinc-950"
              >
                选择文件
              </h2>
              {libraryFiles.length === 0 ? (
                <p className="mt-6 text-center text-[15px] text-zinc-500">
                  暂无文件
                </p>
              ) : (
                <ul className="mt-4 space-y-1">
                  {libraryFiles.map((file) => (
                    <li key={file.id}>
                      <button
                        type="button"
                        onClick={() => linkLibraryFile(file)}
                        className="w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-zinc-50"
                      >
                        <p className="text-[15px] font-semibold text-zinc-950">
                          {file.name}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-500">{file.type}</p>
                        <p className="mt-0.5 text-sm text-zinc-400">
                          更新于 {formatFileUpdated(file.updatedAt)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="px-6 py-4 sm:px-8">
              <button
                type="button"
                onClick={() => setIsFilePickerOpen(false)}
                className={`${secondaryButtonClass} w-full`}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
                <label htmlFor="version-name" className={labelClass}>
                  文件名称
                </label>
                <input
                  id="version-name"
                  type="text"
                  value={versionName}
                  onChange={(event) => setVersionName(event.target.value)}
                  placeholder="例如：CV_v1"
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
                  value={versionNote}
                  onChange={(event) => setVersionNote(event.target.value)}
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
