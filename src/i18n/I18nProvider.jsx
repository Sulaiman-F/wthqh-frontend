import React, { useEffect, useMemo, useState } from "react";
import { translations } from "./translations";
import { I18nContext } from "./context";

export default function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "ar");

  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch {
      void 0; // ignore persistence errors
    }
  }, [lang]);

  const t = useMemo(() => {
    return (key, vars = {}) => {
      const str = (translations[lang] && translations[lang][key]) || key;
      return Object.keys(vars).reduce(
        (acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]),
        str
      );
    };
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }),
    [lang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
