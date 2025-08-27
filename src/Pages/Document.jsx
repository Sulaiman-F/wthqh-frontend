import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { documentsAPI, shareAPI } from "../services/api";
import { toast } from "react-hot-toast";
import { useI18n } from "../i18n/context";
import {
  Share2,
  Plus,
  Download,
  FileText,
  UploadCloud,
  X,
  File as FileIcon,
  ArrowLeft,
  ArrowRight,
  Menu,
} from "lucide-react";

export default function Document() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, dir, lang, setLang } = useI18n();
  const [doc, setDoc] = useState(null);
  const [versions, setVersions] = useState([]);
  const [file, setFile] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [edit, setEdit] = useState({ title: "", description: "", tags: "" });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await documentsAPI.detail(id);
      setDoc(d.document);
      setEdit({
        title: d.document?.title || "",
        description: d.document?.description || "",
        tags: Array.isArray(d.document?.tags) ? d.document.tags.join(",") : "",
      });
      const v = await documentsAPI.listVersions(id);
      setVersions(v.versions || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || t("failedLoadDocument"));
    }
  }, [id, t]);
  useEffect(() => {
    load();
  }, [load]);

  async function addVersion() {
    if (!file) return toast.error(t("choosePdf"));
    try {
      setUploadPct(0);
      await documentsAPI.addVersion(id, file, (p) => setUploadPct(p));
      toast.success(t("versionAdded"));
      setFile(null);
      setUploadPct(0);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || t("addVersionFailed"));
      setUploadPct(0);
    }
  }

  function onPickVersion(e) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }
  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }
  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }
  function removePicked() {
    setFile(null);
    setUploadPct(0);
  }

  async function createShare() {
    try {
      const res = await shareAPI.create(id, 24);
      setShareUrl(res.url);
      toast.success(t("shareLinkCreated"));
    } catch (e) {
      toast.error(e?.response?.data?.message || t("shareFailed"));
    }
  }

  async function saveMeta() {
    try {
      const body = {
        title: edit.title,
        description: edit.description,
        tags: edit.tags
          ? edit.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
      const res = await documentsAPI.updateMeta(id, body);
      setDoc(res.document);
      toast.success(t("saved"));
      setIsEditOpen(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || t("saveFailed"));
    }
  }

  async function downloadVersion(versionId) {
    try {
      const blob = await documentsAPI.downloadVersionBlob(versionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc?.title || "document"}-v${versionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("downloadFailed"));
    }
  }

  async function downloadLatest() {
    try {
      const blob = await documentsAPI.downloadLatestBlob(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc?.title || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("downloadFailed"));
    }
  }

  if (!doc)
    return (
      <div
        dir={dir}
        className="mx-auto min-h-screen max-w-7xl bg-neutral-50 p-6"
      >
        <div
          className={`mb-6 flex h-16 items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 shadow-sm ${
            dir === "rtl" ? "flex-row-reverse" : ""
          }`}
        >
          <div className="h-6 w-6 animate-pulse rounded-full bg-neutral-200" />
          <div className="h-6 w-48 animate-pulse rounded bg-neutral-200" />
        </div>

        <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-3 h-5 w-24 animate-pulse rounded bg-neutral-200" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="h-5 w-56 animate-pulse rounded bg-neutral-200" />
            <div className="h-5 w-56 animate-pulse rounded bg-neutral-200" />
            <div className="sm:col-span-3 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-10/12 animate-pulse rounded bg-neutral-200" />
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-3 h-5 w-28 animate-pulse rounded bg-neutral-200" />
          <div className="h-24 w-full animate-pulse rounded bg-neutral-200" />
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
          <div className="h-10 w-full animate-pulse rounded-t bg-neutral-100" />
          <ul className="divide-y">
            {[...Array(3)].map((_, i) => (
              <li key={i} className="p-3">
                <div className="h-4 w-64 animate-pulse rounded bg-neutral-200" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  return (
    <div dir={dir} className="mx-auto min-h-screen max-w-7xl bg-neutral-50 p-6">
      <div className="relative mb-6 flex h-16 items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            title={t("back")}
            className="cursor-pointer rounded p-1  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {dir === "rtl" ? (
              <ArrowRight size={22} className="text-blue-600" />
            ) : (
              <ArrowLeft size={22} className="text-blue-600" />
            )}
          </button>
          <FileText className="text-blue-600" size={20} />
          <h1 className="text-lg md:text-2xl font-bold text-neutral-800">
            {doc.title}
          </h1>
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            onClick={downloadLatest}
            className="cursor-pointer flex items-center gap-1 rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100"
          >
            <Download size={16} className="text-blue-600" /> {t("download")}
          </button>
          <button
            onClick={createShare}
            className="cursor-pointer flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            <Share2 size={16} /> {t("share")}
          </button>
        </div>
        {/* Mobile menu trigger */}
        <div className="md:hidden">
          <button
            aria-label="Menu"
            className="cursor-pointer rounded p-2 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <Menu size={22} className="text-neutral-700" />
          </button>
        </div>
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <div
              className={`absolute z-50 top-full mt-2 w-56 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg ${
                dir === "rtl" ? "left-0" : "right-0"
              }`}
            >
              <button
                onClick={() => {
                  setMobileOpen(false);
                  downloadLatest();
                }}
                className="w-full cursor-pointer flex items-center justify-start gap-2 rounded px-3 py-2 text-sm hover:bg-neutral-100"
              >
                <Download size={16} className="text-blue-600" />
                <span>{t("download")}</span>
              </button>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  createShare();
                }}
                className="w-full cursor-pointer flex items-center justify-start gap-2 rounded px-3 py-2 text-sm hover:bg-neutral-100"
              >
                <Share2 size={16} className="text-blue-600" />
                <span>{t("share")}</span>
              </button>
              <button
                onClick={() => {
                  setLang((p) => (p === "en" ? "ar" : "en"));
                  setMobileOpen(false);
                }}
                className="w-full cursor-pointer flex items-center justify-start gap-2 rounded px-3 py-2 text-sm hover:bg-neutral-100"
                title={lang === "en" ? "العربية" : "English"}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-neutral-300 text-[10px]">
                  {lang === "en" ? "AR" : "EN"}
                </span>
                <span>{lang === "en" ? "العربية" : "English"}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {shareUrl && (
        <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow-sm">
          {t("publicLink")}{" "}
          <a
            className="text-blue-600 underline"
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
          >
            {shareUrl}
          </a>
        </div>
      )}

      <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-800">{t("metadata")}</h2>
          <button
            onClick={() => {
              // Ensure edit state reflects latest doc before opening
              setEdit({
                title: doc?.title || "",
                description: doc?.description || "",
                tags: Array.isArray(doc?.tags) ? doc.tags.join(",") : "",
              });
              setIsEditOpen(true);
            }}
            className="cursor-pointer rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            {t("edit")}
          </button>
        </div>
        <div className="text-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
                {t("title")}
              </div>
              <div className="text-base font-medium text-neutral-900">
                {doc.title || "-"}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
                {t("tags")}
              </div>
              {Array.isArray(doc.tags) && doc.tags.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags.map((t, i) => (
                    <span
                      key={`${t}-${i}`}
                      className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-neutral-400">-</div>
              )}
            </div>
            <div className="sm:col-span-3">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
                {t("description")}
              </div>
              <div className="whitespace-pre-wrap text-neutral-800">
                {doc.description || "-"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-neutral-800">
          {t("addVersion")}
        </h2>
        <div
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragActive ? "border-blue-400 bg-blue-50/50" : "border-neutral-300"
          }`}
        >
          {!file ? (
            <div className="flex flex-col items-center gap-2 text-neutral-600">
              <UploadCloud className="text-blue-600" size={36} />
              <div className="text-sm">
                {t("dndHint")}
                <label className="ml-1 cursor-pointer text-blue-600 underline">
                  {t("browse")}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={onPickVersion}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-xs text-neutral-500">{t("pdfOnlyLong")}</div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileIcon className="text-blue-600" size={18} />
                <div className="truncate text-sm text-neutral-800">
                  {file.name}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {uploadPct > 0 && (
                  <div className="w-40">
                    <div className="h-2 w-full rounded bg-neutral-200">
                      <div
                        className="h-2 rounded bg-blue-600 transition-all"
                        style={{ width: `${uploadPct}%` }}
                      />
                    </div>
                  </div>
                )}
                <button
                  onClick={removePicked}
                  className="cursor-pointer rounded border border-neutral-300 p-1 hover:bg-neutral-100"
                  aria-label={t("remove")}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={addVersion}
            disabled={!file}
            className="cursor-pointer inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={16} /> {t("uploadVersion")}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <h2 className="border-b p-3 font-semibold text-neutral-800">
          {t("versions")}
        </h2>
        <ul className="divide-y">
          {versions.map((v) => (
            <li
              key={v._id}
              className="flex items-center justify-between p-3 text-sm hover:bg-blue-50/50"
            >
              <span>
                v{v.versionNumber} • {new Date(v.createdAt).toLocaleString()}
              </span>
              <button
                onClick={() => downloadVersion(v._id)}
                className="cursor-pointer rounded border border-neutral-300 px-2 py-1 hover:bg-neutral-100"
              >
                <Download size={16} className="text-blue-600" />
              </button>
            </li>
          ))}
          {!versions.length && (
            <li className="p-3 text-sm text-neutral-500">{t("noVersions")}</li>
          )}
        </ul>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-800">
                {t("edit")}{" "}
                {t("metadata").toLowerCase?.()
                  ? t("metadata").toLowerCase()
                  : t("metadata")}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded border border-neutral-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={t("title")}
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              />
              <input
                className="rounded border border-neutral-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={t("tagsComma")}
                value={edit.tags}
                onChange={(e) => setEdit({ ...edit, tags: e.target.value })}
              />
              <textarea
                className="col-span-2 h-28 rounded border border-neutral-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={t("description")}
                value={edit.description}
                onChange={(e) =>
                  setEdit({ ...edit, description: e.target.value })
                }
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsEditOpen(false)}
                className="cursor-pointer rounded border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100"
              >
                {t("cancel")}
              </button>
              <button
                onClick={saveMeta}
                className="cursor-pointer rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
