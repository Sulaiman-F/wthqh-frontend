import React, { useEffect, useState } from "react";
import { useParams } from "react-router";

export default function PublicPreview() {
  const { token } = useParams();
  const [url, setUrl] = useState("");

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    setUrl(`${base.replace(/\/$/, "")}/public/${token}`);
  }, [token]);

  return (
    <div className="h-screen w-full bg-neutral-50">
      <div className="mx-auto max-w-6xl p-4">
        <div className="mb-3 rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow-sm">
          Public view token:{" "}
          <span className="font-mono text-neutral-700">{token}</span>
        </div>
      </div>
      <iframe
        title="preview"
        src={url}
        className="mx-auto block h-[82%] w-full max-w-6xl rounded-lg border border-neutral-200 bg-white shadow-sm"
      />
      <div className="mx-auto max-w-6xl p-3 text-center">
        <a
          className="text-blue-600 underline"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          Open in new tab
        </a>
      </div>
    </div>
  );
}
