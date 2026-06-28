import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { translations } from "@/i18n";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem("kc_lang") || "DE");
  const [model, setModel] = useState(() => localStorage.getItem("kc_model") || "claude-sonnet-4-6");
  const [brands, setBrands] = useState([]);
  const [activeBrandId, setActiveBrandId] = useState(() => localStorage.getItem("kc_brand") || "kickstartercash");

  const t = useCallback((key) => translations[lang][key] || key, [lang]);

  const loadBrands = useCallback(async () => {
    const res = await axios.get(`${API}/brands`);
    setBrands(res.data);
    return res.data;
  }, []);

  useEffect(() => { loadBrands(); }, [loadBrands]);
  useEffect(() => { localStorage.setItem("kc_lang", lang); }, [lang]);
  useEffect(() => { localStorage.setItem("kc_model", model); }, [model]);
  useEffect(() => { localStorage.setItem("kc_brand", activeBrandId); }, [activeBrandId]);

  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0];

  return (
    <AppContext.Provider value={{
      lang, setLang, model, setModel, t,
      brands, loadBrands, activeBrandId, setActiveBrandId, activeBrand,
    }}>
      {children}
    </AppContext.Provider>
  );
};
