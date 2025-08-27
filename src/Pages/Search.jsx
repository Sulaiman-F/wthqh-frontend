import React, { useState } from "react";
import { useNavigate } from "react-router";
import { searchAPI } from "../services/api";
import { toast } from "react-hot-toast";
import { useI18n } from "../i18n/context";
import {
  Search as SearchIcon,
  FileText,
  Folder,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ documents: [], folders: [] });
  const navigate = useNavigate();
  const { t, dir } = useI18n();

  async function onSearch(e) {
    e.preventDefault();
    if (!q.trim()) return;
    try {
      setLoading(true);
      const data = await searchAPI.search(q.trim());
      setResults({
        documents: data?.documents || [],
        folders: data?.folders || [],
      });
    } catch (e) {
      toast.error(e?.response?.data?.message || t("searchFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={dir} className="mx-auto min-h-screen max-w-7xl bg-neutral-50 p-6">
      <form
        onSubmit={onSearch}
        className="mb-6 flex gap-2 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm"
      >
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
        <input
          className="w-full rounded border border-neutral-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder={t("searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="text"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch(e);
            }
          }}
        />
        <button className="cursor-pointer flex items-center gap-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <SearchIcon size={16} /> {t("search")}
        </button>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <div className="mb-2 h-5 w-28 animate-pulse rounded bg-neutral-200" />
            <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-3">
                  <div className="h-5 w-5 animate-pulse rounded bg-neutral-200" />
                  <div className="h-4 w-60 animate-pulse rounded bg-neutral-200" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 h-5 w-24 animate-pulse rounded bg-neutral-200" />
            <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-3">
                  <div className="h-5 w-5 animate-pulse rounded bg-neutral-200" />
                  <div className="h-4 w-60 animate-pulse rounded bg-neutral-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold text-neutral-800">
              {t("documents")}
            </h3>
            <ul className="divide-y rounded-lg border border-neutral-200 bg-white shadow-sm">
              {results.documents.map((d) => (
                <li
                  key={d._id}
                  className="flex items-center gap-2 p-3 hover:bg-blue-50/50"
                >
                  <button
                    className="flex items-center gap-2"
                    onClick={() => navigate(`/documents/${d._id}`)}
                  >
                    <FileText size={18} className="text-blue-600" />{" "}
                    <span className="text-neutral-800">{d.title}</span>
                  </button>
                </li>
              ))}
              {!results.documents.length && (
                <li className="p-3 text-sm text-neutral-500">
                  {t("noResults")}
                </li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-neutral-800">
              {t("folders")}
            </h3>
            <ul className="divide-y rounded-lg border border-neutral-200 bg-white shadow-sm">
              {results.folders.map((f) => (
                <li
                  key={f._id}
                  className="flex items-center gap-2 p-3 hover:bg-blue-50/50"
                >
                  <button
                    className="flex items-center gap-2"
                    onClick={() => navigate(`/folders/${f._id}`)}
                  >
                    <Folder size={18} className="text-blue-600" />{" "}
                    <span className="text-neutral-800">{f.name}</span>
                  </button>
                </li>
              ))}
              {!results.folders.length && (
                <li className="p-3 text-sm text-neutral-500">
                  {t("noResults")}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
