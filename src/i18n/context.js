import React, { createContext, useContext } from "react";

export const I18nContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
  dir: "ltr",
});

export function useI18n() {
  return useContext(I18nContext);
}
