import i18next from "i18next";
import I18nextCLILanguageDetector from "i18next-cli-language-detector";
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

export const initI18n = async () => {
  await i18next.use(I18nextCLILanguageDetector).init({
    defaultNS,
    resources,
  });
};