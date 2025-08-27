import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { foldersAPI, documentsAPI } from "../services/api";
import { toast } from "react-hot-toast";
import { useI18n } from "../i18n/context";
import {
  Folder as FolderIcon,
  FileText,
  PlusCircle,
  Upload,
  Download,
  Trash,
  Search as SearchIcon,
  ArrowLeft,
  ArrowRight,
  Menu,
  UploadCloud,
  File as FileIcon,
  X,
  Pencil,
  LogOut,
} from "lucide-react";

// i18n is now provided app-wide

export default function Folders() {
  const { id = "root" } = useParams();
  const navigate = useNavigate();
  const { lang, setLang, t, dir } = useI18n();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    tags: "",
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentName, setCurrentName] = useState("");
  const [renameModal, setRenameModal] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [parentId, setParentId] = useState("root");
  const [mobileOpen, setMobileOpen] = useState(false);

  function logout() {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    } catch {
      // ignore storage cleanup errors
    }
    navigate("/login");
  }

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const f = await foldersAPI.list(id);
      setFolders(f.folders || []);
      if (id !== "root") {
        const d = await foldersAPI.listDocuments(id);
        setDocuments(d.documents || []);
        try {
          const t = await foldersAPI.tree();
          const name = findNameInTree(t.tree || [], id) || id;
          setCurrentName(name);
          const p = findParentIdInTree(t.tree || [], id) || "root";
          setParentId(p);
        } catch {
          setCurrentName(id);
          setParentId("root");
        }
      } else {
        setDocuments([]);
        setCurrentName("");
        setParentId("root");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function createFolder(e) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await foldersAPI.create({ name: newFolderName.trim(), parentId: id });
      toast.success("Folder created");
      setNewFolderName("");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Create failed");
    }
  }

  async function onUpload(e) {
    e.preventDefault();
    if (!uploadFile) return toast.error("Choose a PDF file");
    try {
      setUploading(true);
      setUploadProgress(0);
      const tags = uploadForm.tags
        ? uploadForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      await documentsAPI.upload({
        folderId: id,
        title: uploadForm.title || uploadFile.name,
        description: uploadForm.description,
        tags,
        file: uploadFile,
        onProgress: (pct) => setUploadProgress(pct),
      });
      toast.success("Uploaded");
      setUploadForm({ title: "", description: "", tags: "" });
      setUploadFile(null);
      setUploadProgress(0);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onPickFile(file) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("PDF files only");
      return;
    }
    setUploadFile(file);
    if (!uploadForm.title) setUploadForm((f) => ({ ...f, title: file.name }));
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    onPickFile(file);
  }
  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }
  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  async function downloadDoc(docId, title) {
    try {
      const blob = await documentsAPI.downloadLatestBlob(docId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  }

  function openDelete(folder) {
    setDeleteModal({ open: true, id: folder._id, name: folder.name });
  }
  async function confirmDelete() {
    if (!deleteModal.id) return;
    try {
      await foldersAPI.remove(deleteModal.id);
      toast.success("Folder deleted");
      setDeleteModal({ open: false, id: null, name: "" });
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  }

  function openRename(folder) {
    setRenameModal({ open: true, id: folder._id, name: folder.name });
  }
  async function submitRename(e) {
    e.preventDefault();
    if (!renameModal.id || !renameModal.name.trim()) return;
    try {
      await foldersAPI.rename(renameModal.id, renameModal.name.trim());
      toast.success("Folder renamed");
      setRenameModal({ open: false, id: null, name: "" });
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Rename failed");
    }
  }

  function goUp() {
    if (id === "root") return;
    if (parentId) navigate(`/folders/${parentId}`);
    else navigate("/folders/root");
  }

  return (
    <div dir={dir} className="mx-auto min-h-screen max-w-7xl bg-neutral-50 p-6">
      <div className="relative mb-6 flex h-16 items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          {id !== "root" && (
            <button
              onClick={goUp}
              title={t("upOneLevel")}
              className="cursor-pointer rounded p-1 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {dir === "rtl" ? (
                <ArrowRight size={22} className="text-blue-600" />
              ) : (
                <ArrowLeft size={22} className="text-blue-600" />
              )}
            </button>
          )}
          <h1 className="text-lg md:text-2xl font-bold text-neutral-800">
            {id !== "root" ? `${currentName}` : t("myDrive")}
          </h1>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => navigate("/search")}
            className="cursor-pointer flex items-center gap-1 rounded border border-blue-600 px-3 py-1 text-sm text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200"
          >
            <SearchIcon size={16} /> {t("search")}
          </button>
          <button
            onClick={() => setLang((p) => (p === "en" ? "ar" : "en"))}
            className="cursor-pointer flex items-center gap-1 rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100"
            title={lang === "en" ? "العربية" : "English"}
          >
            {lang === "en" ? "AR" : "EN"}
          </button>
          <button
            onClick={logout}
            className="cursor-pointer flex items-center gap-1 rounded border border-red-600 px-3 py-1 text-sm text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200"
          >
            <LogOut size={16} /> {t("logout")}
          </button>
        </div>
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            aria-label="Menu"
            className="cursor-pointer rounded p-2 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <Menu size={22} className="text-neutral-700" />
          </button>
        </div>
        {/* Mobile dropdown */}
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
                  navigate("/search");
                }}
                className="w-full cursor-pointer flex items-center justify-start gap-2 rounded px-3 py-2 text-sm hover:bg-neutral-100"
              >
                <SearchIcon size={16} className="text-blue-600" />
                <span>{t("search")}</span>
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
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="w-full cursor-pointer flex items-center justify-start gap-2 rounded px-3 py-2 text-sm hover:bg-neutral-100 text-red-600"
              >
                <LogOut size={16} />
                <span>{t("logout")}</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <form
          onSubmit={createFolder}
          className={
            "rounded-lg border border-neutral-200 bg-white p-4 shadow-sm" +
            (id === "root" ? " md:col-span-2" : "")
          }
        >
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-neutral-800">
            <PlusCircle size={18} /> {t("createFolder")}
          </h2>
          <div className="flex gap-2">
            <input
              className="w-full rounded border border-neutral-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={t("folderName")}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <button className="cursor-pointer rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              {t("createFolder")}
            </button>
          </div>
        </form>

        {id !== "root" && (
          <form
            onSubmit={onUpload}
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-neutral-800">
              <Upload size={18} className="text-blue-600" /> {t("uploadPdf")}
            </h2>
            <div
              className={`relative mb-3 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-neutral-300"
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              {!uploadFile ? (
                <>
                  <UploadCloud className="text-blue-600" size={36} />
                  <div className="text-sm text-neutral-700">
                    {t("clickOrDrag")}
                  </div>
                  <div className="text-xs text-neutral-500">{t("pdfOnly")}</div>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(e) => onPickFile(e.target.files?.[0])}
                    disabled={uploading}
                  />
                </>
              ) : (
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileIcon size={28} className="text-blue-600 " />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-neutral-800">
                        {uploadFile.name}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {formatBytes(uploadFile.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cursor-pointer rounded p-1 hover:bg-neutral-200"
                    onClick={() => {
                      setUploadFile(null);
                      setUploadProgress(0);
                    }}
                    disabled={uploading}
                    title="Remove"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <input
                className="rounded border border-neutral-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={t("title")}
                value={uploadForm.title}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, title: e.target.value })
                }
                disabled={uploading}
              />
              <input
                className="rounded border border-neutral-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={t("tagsComma")}
                value={uploadForm.tags}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, tags: e.target.value })
                }
                disabled={uploading}
              />
              <input
                className="col-span-2 rounded border border-neutral-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={t("description")}
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, description: e.target.value })
                }
                disabled={uploading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-neutral-500">{t("pdfOnly")}</div>
              <button
                disabled={uploading || !uploadFile}
                className="cursor-pointer inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {uploading ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t("uploading")} {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload size={16} /> {t("upload")}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className={id === "root" ? " md:col-span-2" : ""}>
            <div className="mb-2 h-5 w-24 md:w-32 animate-pulse rounded bg-neutral-200" />
            <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 p-3"
                >
                  <div className="flex min-w-0 items-center gap-2 w-full">
                    <div className="h-5 w-5 animate-pulse rounded bg-neutral-200" />
                    <div className="h-4 w-1/2 sm:w-2/3 md:w-1/2 lg:w-4/5 animate-pulse rounded bg-neutral-200" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-12 sm:w-16 animate-pulse rounded bg-neutral-200" />
                    <div className="h-7 w-12 sm:w-16 animate-pulse rounded bg-neutral-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {id !== "root" && (
            <div>
              <div className="mb-2 h-5 w-24 md:w-28 animate-pulse rounded bg-neutral-200" />
              <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-2 w-full">
                      <div className="h-5 w-5 animate-pulse rounded bg-neutral-200" />
                      <div className="h-4 w-2/3 sm:w-3/4 md:w-1/2 animate-pulse rounded bg-neutral-200" />
                    </div>
                    <div className="h-7 w-16 sm:w-20 animate-pulse rounded bg-neutral-200" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className={id === "root" ? " md:col-span-2" : ""}>
            <h3 className="mb-2 font-semibold text-neutral-800">
              {t("folders")}
            </h3>
            <ul className="divide-y rounded-lg border border-neutral-200 bg-white shadow-sm">
              {folders.map((f) => (
                <li
                  key={f._id}
                  className="flex items-center justify-between gap-2 p-3 hover:bg-blue-50/50"
                >
                  <button
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate(`/folders/${f._id}`)}
                  >
                    <FolderIcon size={18} className="text-blue-600" />{" "}
                    <span className="text-neutral-800">{f.name}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      title={t("renameFolder")}
                      onClick={() => openRename(f)}
                      className="cursor-pointer rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100"
                    >
                      <Pencil size={16} className="text-blue-600" />
                    </button>
                    <button
                      title={t("deleteFolder")}
                      onClick={() => openDelete(f)}
                      className="cursor-pointer rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100"
                    >
                      <Trash size={16} className="text-red-600" />
                    </button>
                  </div>
                </li>
              ))}
              {!folders.length && (
                <li className="p-3 text-sm text-neutral-500">
                  {t("noFolders")}
                </li>
              )}
            </ul>
          </div>
          {id !== "root" && (
            <div>
              <h3 className="mb-2 font-semibold text-neutral-800">
                {t("documents")}
              </h3>
              <ul className="divide-y rounded-lg border border-neutral-200 bg-white shadow-sm">
                {documents.map((d) => (
                  <li
                    key={d._id}
                    className="flex items-center justify-between gap-2 p-3 hover:bg-blue-50/50"
                  >
                    <button
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => navigate(`/documents/${d._id}`)}
                    >
                      <FileText size={18} className="text-blue-600" />{" "}
                      <span className="text-neutral-800">{d.title}</span>
                    </button>
                    <button
                      title={t("download")}
                      onClick={() => downloadDoc(d._id, d.title)}
                      className="cursor-pointer rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100"
                    >
                      <Download size={16} className="text-blue-600" />
                    </button>
                  </li>
                ))}
                {!documents.length && (
                  <li className="p-3 text-sm text-neutral-500">
                    {t("noDocuments")}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Rename Modal */}
      <Modal
        open={renameModal.open}
        title={t("renameFolder")}
        onClose={() => setRenameModal({ open: false, id: null, name: "" })}
      >
        <form onSubmit={submitRename} className="flex flex-col gap-2">
          <input
            className="rounded border border-neutral-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={renameModal.name}
            onChange={(e) =>
              setRenameModal((m) => ({ ...m, name: e.target.value }))
            }
            placeholder={t("folderName")}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setRenameModal({ open: false, id: null, name: "" })
              }
              className="cursor-pointer rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100"
            >
              {t("cancel")}
            </button>
            <button className="cursor-pointer rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              {t("save")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={deleteModal.open}
        title={t("deleteFolder")}
        onClose={() => setDeleteModal({ open: false, id: null, name: "" })}
      >
        <p className="mb-3 text-sm">
          {t("deletePrompt", { name: deleteModal.name })}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteModal({ open: false, id: null, name: "" })}
            className="cursor-pointer rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100"
          >
            {t("cancel")}
          </button>
          <button
            onClick={confirmDelete}
            className="cursor-pointer rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {t("delete")}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function findNameInTree(nodes, targetId) {
  for (const n of nodes) {
    if (n.id === targetId) return n.name;
    if (Array.isArray(n.children) && n.children.length) {
      const found = findNameInTree(n.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

function findParentIdInTree(nodes, targetId, parentId = "root") {
  for (const n of nodes) {
    if (n.id === targetId) return parentId;
    if (Array.isArray(n.children) && n.children.length) {
      const found = findParentIdInTree(n.children, targetId, n.id);
      if (found) return found;
    }
  }
  return null;
}

// Simple modal components
function Modal({ open, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg">
        <div className="mb-3 border-b border-neutral-200 pb-2 text-lg font-semibold text-neutral-800">
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${sizes[i]}`;
}
