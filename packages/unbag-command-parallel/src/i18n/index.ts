import i18next from "i18next";
import zh from "@/i18n/langs/zh.json";
import en from "@/i18n/langs/en.json";
export const defaultNS = "defaultNS";
export const resources = {
  en: {
    [defaultNS]: en,
  },
  zh: {
    [defaultNS]: zh,
  },
} as const;

export const initI18n = async (lang: string) => {
  await i18next.init({
    lng: lang,
    defaultNS,
    resources,
  });
};
