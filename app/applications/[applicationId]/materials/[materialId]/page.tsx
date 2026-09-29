"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  isCommonLinkedMaterial,
  useApplications,
  type MaterialSource,
} from "@/app/applications-context";
import { useCommonDocuments } from "@/app/common-documents-context";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400";

const labelClassName =
  "text-xs font-medium uppercase tracking-wide text-zinc-400";

function formatVersionDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function friendlyVersionLabel(fileName: string) {
  return fileName.replace(/\.pdf$/i, "").replace(/_/g, " ");
}

export default function MaterialWorkspacePage() {
  const params = useParams<{
    applicationId: string;
    materialId: string;
  }>();
  const {
    getMaterial,
    addMaterialVersion,
    updateMaterial,
    linkMaterialToCommonDocument,
    unlinkMaterialFromCommonDocument,
  } = useApplications();
  const { documents, getDocumentVersion } = useCommonDocuments();
  const [isAddVersionOpen, setIsAddVersionOpen] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [versionNote, setVersionNote] = useState("");
  const [filePlaceholder, setFilePlaceholder] = useState("");
  const [isChangingLink, setIsChangingLink] = useState(false);
  const [draftDocumentId, setDraftDocumentId] = useState("");
  const [draftVersionId, setDraftVersionId] = useState("");
  const titleId = useId();

  const result = getMaterial(params.applicationId, params.materialId);

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
    setFilePlaceholder("");
  }

  function saveVersion() {
    if (!result || !versionName.trim()) return;

    addMaterialVersion(result.application.id, result.material.id, {
      name: versionName.trim(),
      date: new Date().toISOString().slice(0, 10),
      note: versionNote.trim() || undefined,
      fileName: filePlaceholder.trim() || "File placeholder",
    });
    closeAddVersion();
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

  if (!result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f5f5f7] px-6 py-16">
        <p className="text-lg text-zinc-600">Material not found.</p>
        <Link
          href="/dashboard"
          className="mt-6 text-sm font-medium text-zinc-900 hover:underline"
        >
          ← Back to Dashboard
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
    <div className="flex flex-1 flex-col bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:px-8 sm:py-14">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium text-zinc-500">
            {application.school}
          </p>
          <p className="mt-1 text-[15px] text-zinc-600">{application.program}</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            {material.label}
          </h1>
        </div>

        <section className="mt-10 rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] sm:p-6">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            材料来源
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Choose whether this material is project-specific or linked from
            Common Documents.
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
                Prepared specifically for this application.
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
                Reference a document from Common Documents.
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
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100"
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
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100"
                >
                  取消关联
                </button>
              </div>
            </div>
          ) : null}

          {showCommonPicker ? (
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="common-document" className={labelClassName}>
                  选择通用材料
                </label>
                <select
                  id="common-document"
                  value={draftDocumentId}
                  onChange={(event) => {
                    setDraftDocumentId(event.target.value);
                    setDraftVersionId("");
                  }}
                  className={fieldClassName}
                >
                  <option value="">Select a document</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>

              {draftDocumentId ? (
                <div>
                  <label htmlFor="common-version" className={labelClassName}>
                    选择版本
                  </label>
                  <select
                    id="common-version"
                    value={draftVersionId}
                    onChange={(event) => setDraftVersionId(event.target.value)}
                    className={fieldClassName}
                  >
                    <option value="">Select a version</option>
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
                  className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  Save Link
                </button>
                {isLinked ? (
                  <button
                    type="button"
                    onClick={cancelCommonLinkEdit}
                    className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        {source === "project" ? (
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
              {material.versions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-10 text-center text-[15px] text-zinc-500">
                  No versions yet. Add your first version to get started.
                </p>
              ) : (
                material.versions.map((version) => (
                  <article
                    key={version.id}
                    className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">
                          {version.name}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          {formatVersionDate(version.date)}
                        </p>
                      </div>
                    </div>

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
                          {version.fileName || "File placeholder"}
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
        ) : null}
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
                <label htmlFor="version-name" className={labelClassName}>
                  Version name
                </label>
                <input
                  id="version-name"
                  type="text"
                  value={versionName}
                  onChange={(event) => setVersionName(event.target.value)}
                  placeholder="e.g. PS v3"
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
                  value={versionNote}
                  onChange={(event) => setVersionNote(event.target.value)}
                  placeholder="Optional note"
                  rows={3}
                  className={`${fieldClassName} resize-none`}
                />
              </div>

              <div>
                <label htmlFor="version-file" className={labelClassName}>
                  File placeholder
                </label>
                <input
                  id="version-file"
                  type="text"
                  value={filePlaceholder}
                  onChange={(event) => setFilePlaceholder(event.target.value)}
                  placeholder="e.g. ps-v3.pdf"
                  className={fieldClassName}
                />
                <p className="mt-2 text-xs text-zinc-400">
                  Real file upload is not implemented yet.
                </p>
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
