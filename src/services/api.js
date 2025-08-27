import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Attach token automatically and handle 401 by refreshing or redirecting to login
axios.interceptors.request.use((config) => {
  try {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    // Only set Authorization if not already provided
    if (token && !config.headers?.Authorization) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  } catch {
    // no-op: localStorage unavailable
  }
  return config;
});

let refreshing = null; // promise singleton to avoid parallel refresh calls
axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error || {};
    const status = response?.status;
    const originalRequest = config || {};
    // If unauthorized, try refresh once
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const rt =
          typeof window !== "undefined"
            ? localStorage.getItem("refreshToken")
            : null;
        if (!rt) throw new Error("No refresh token");

        // De-duplicate refresh calls
        if (!refreshing) {
          refreshing = axios
            .post(`${BASE}/auth/refresh`, { refreshToken: rt })
            .then((r) => r.data)
            .finally(() => {
              refreshing = null;
            });
        }
        const data = await refreshing;
        if (data?.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${data.accessToken}`,
          };
          return axios(originalRequest);
        }
        throw new Error("No access token in refresh response");
      } catch {
        try {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        } catch {
          // ignore cleanup errors
        }
        if (typeof window !== "undefined") window.location.replace("/login");
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const authAPI = {
  async signin(email, password) {
    const { data } = await axios.post(`${BASE}/auth/signin`, {
      email,
      password,
    });
    // expected: { success, accessToken, refreshToken, user }
    return data;
  },
  async signup(email, password) {
    const { data } = await axios.post(`${BASE}/auth/signup`, {
      name: email.split("@")[0],
      email,
      password,
    });
    // expected: { success, accessToken, refreshToken, user }
    return data;
  },
};

export const foldersAPI = {
  async list(parentId) {
    const params = parentId && parentId !== "root" ? { parent: parentId } : {};
    const { data } = await axios.get(`${BASE}/folders`, {
      params,
      headers: authHeaders(),
    });
    return data; // { success, folders: [...] } per controller
  },
  async tree() {
    const { data } = await axios.get(`${BASE}/folders`, {
      params: { tree: true },
      headers: authHeaders(),
    });
    return data; // { success, tree }
  },
  async create({ name, parentId }) {
    const body = { name };
    if (parentId && parentId !== "root") body.parentFolderId = parentId;
    const { data } = await axios.post(`${BASE}/folders`, body, {
      headers: authHeaders(),
    });
    return data; // { success, folder }
  },
  async rename(id, name) {
    const { data } = await axios.patch(
      `${BASE}/folders/${id}`,
      { name },
      { headers: authHeaders() }
    );
    return data; // { success, folder }
  },
  async listDocuments(folderId) {
    const { data } = await axios.get(`${BASE}/folders/${folderId}/documents`, {
      headers: authHeaders(),
    });
    return data; // { success, documents }
  },
  async remove(id) {
    const { data } = await axios.delete(`${BASE}/folders/${id}`, {
      headers: authHeaders(),
    });
    return data; // 204 no content or { success }
  },
};

export const documentsAPI = {
  async detail(id) {
    const { data } = await axios.get(`${BASE}/documents/${id}`, {
      headers: authHeaders(),
    });
    return data; // { success, document }
  },
  async upload({ folderId, title, description, tags, file, onProgress }) {
    const fd = new FormData();
    fd.append("folderId", folderId);
    fd.append("title", title);
    if (description) fd.append("description", description);
    if (Array.isArray(tags)) tags.forEach((t) => fd.append("tags", t));
    fd.append("file", file);
    const { data } = await axios.post(`${BASE}/documents`, fd, {
      headers: { ...authHeaders() },
      withCredentials: false,
      onUploadProgress: (evt) => {
        try {
          if (!onProgress) return;
          const total = evt.total || 0;
          if (total > 0) {
            const pct = Math.round((evt.loaded / total) * 100);
            onProgress(pct);
          }
        } catch {
          // ignore progress errors
        }
      },
    });
    return data; // { success, document, version }
  },
  async downloadLatestBlob(id) {
    const res = await axios.get(`${BASE}/documents/${id}/download`, {
      headers: authHeaders(),
      responseType: "blob",
    });
    return res.data;
  },
  async listVersions(id) {
    const { data } = await axios.get(`${BASE}/documents/${id}/versions`, {
      headers: authHeaders(),
    });
    return data; // { success, versions }
  },
  async downloadVersionBlob(versionId) {
    const res = await axios.get(
      `${BASE}/documents/versions/${versionId}/download`,
      {
        headers: authHeaders(),
        responseType: "blob",
      }
    );
    return res.data;
  },
  async addVersion(id, file, onProgress) {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axios.post(`${BASE}/documents/${id}/versions`, fd, {
      headers: { ...authHeaders() },
      onUploadProgress: (evt) => {
        try {
          if (!onProgress) return;
          const total = evt.total || 0;
          if (total > 0) {
            const pct = Math.round((evt.loaded / total) * 100);
            onProgress(pct);
          }
        } catch {
          // ignore progress errors
        }
      },
    });
    return data; // { success, version }
  },
  async updateMeta(id, body) {
    const { data } = await axios.patch(`${BASE}/documents/${id}`, body, {
      headers: authHeaders(),
    });
    return data; // { success, document }
  },
};

export const shareAPI = {
  async create(documentId, expiresInHours) {
    const { data } = await axios.post(
      `${BASE}/documents/${documentId}/share`,
      { expiresInHours },
      { headers: authHeaders() }
    );
    return data; // { success, token, url, expiresAt }
  },
  publicUrl(token) {
    return `${BASE.replace(/\/$/, "")}/public/${token}`;
  },
};

export const searchAPI = {
  async search(q) {
    const { data } = await axios.get(`${BASE}/search`, {
      params: { q },
      headers: authHeaders(),
    });
    return data;
  },
};
