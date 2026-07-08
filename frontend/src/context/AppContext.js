import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { translations } from "@/i18n";

// Fallback keeps the app working even when the env var is missing in a new
// hosting setup (e.g. after moving the Netlify site to another account).
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://brandmind-api.onrender.com";
export const API = `${BACKEND_URL}/api`;

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

const TOKEN_KEY = "bm_token";

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem("kc_lang") || "DE");
  const [model, setModel] = useState(() => localStorage.getItem("kc_model") || "claude-sonnet-4-6");
  const [brands, setBrands] = useState([]);
  const [activeBrandId, setActiveBrandId] = useState(() => localStorage.getItem("kc_brand") || "kickstartercash");

  // --- Brandmind auth / tenancy -------------------------------------------
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    () => localStorage.getItem("bm_workspace") || ""
  );
  const [authReady, setAuthReady] = useState(false);

  // Attach the bearer token to every request while logged in.
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  // Tell the backend which workspace the request is scoped to.
  useEffect(() => {
    if (activeWorkspaceId) {
      axios.defaults.headers.common["X-Workspace-Id"] = activeWorkspaceId;
    } else {
      delete axios.defaults.headers.common["X-Workspace-Id"];
    }
  }, [activeWorkspaceId]);

  const applyAuth = useCallback((data) => {
    setToken(data.token);
    setUser(data.user);
    setWorkspaces(Array.isArray(data.workspaces) ? data.workspaces : []);
    const wsId = data.active_workspace_id || data.workspaces?.[0]?.id || "";
    setActiveWorkspaceId(wsId);
    if (wsId) localStorage.setItem("bm_workspace", wsId);
  }, []);

  const register = useCallback(async (payload) => {
    const res = await axios.post(`${API}/auth/register`, payload);
    applyAuth(res.data);
    return res.data;
  }, [applyAuth]);

  const login = useCallback(async (payload) => {
    const res = await axios.post(`${API}/auth/login`, payload);
    applyAuth(res.data);
    return res.data;
  }, [applyAuth]);

  const createWorkspace = useCallback(async ({ name, industry = "" }) => {
    const res = await axios.post(`${API}/workspaces`, { name, industry });
    setWorkspaces((prev) => [...prev, res.data]);
    setActiveWorkspaceId(res.data.id);
    localStorage.setItem("bm_workspace", res.data.id);
    return res.data;
  }, []);

  const switchWorkspace = useCallback((id) => {
    setActiveWorkspaceId(id);
    localStorage.setItem("bm_workspace", id);
  }, []);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspaceId("");
    localStorage.removeItem("bm_workspace");
  }, []);

  // Restore session on load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (token) {
        try {
          const res = await axios.get(`${API}/auth/me`);
          if (!cancelled) {
            setUser(res.data.user);
            setWorkspaces(Array.isArray(res.data.workspaces) ? res.data.workspaces : []);
          }
        } catch {
          if (!cancelled) logout();
        }
      }
      if (!cancelled) setAuthReady(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = useCallback((key) => translations[lang][key] || key, [lang]);

  const loadBrands = useCallback(async () => {
    const res = await axios.get(`${API}/brands`);
    // A misconfigured backend URL can return the SPA's index.html (an HTML
    // string) with status 200 — never let a non-array reach `brands`.
    const list = Array.isArray(res.data) ? res.data : [];
    setBrands(list);
    return list;
  }, []);

  useEffect(() => {
    loadBrands().catch((error) => {
      // Brand data is non-critical for the shell; do not let API/network issues blank the app.
      console.warn("Unable to load brands", error);
      setBrands([]);
    });
  }, [loadBrands, activeWorkspaceId]);
  useEffect(() => { localStorage.setItem("kc_lang", lang); }, [lang]);
  useEffect(() => { localStorage.setItem("kc_model", model); }, [model]);
  useEffect(() => { localStorage.setItem("kc_brand", activeBrandId); }, [activeBrandId]);
  useEffect(() => {
    if (activeWorkspaceId) localStorage.setItem("bm_workspace", activeWorkspaceId);
  }, [activeWorkspaceId]);

  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0];
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <AppContext.Provider value={{
      lang, setLang, model, setModel, t,
      brands, loadBrands, activeBrandId, setActiveBrandId, activeBrand,
      // Brandmind auth / tenancy
      token, user, workspaces, activeWorkspaceId, setActiveWorkspaceId,
      activeWorkspace, authReady, isAuthenticated: !!token && !!user,
      register, login, logout, createWorkspace, switchWorkspace,
    }}>
      {children}
    </AppContext.Provider>
  );
};
