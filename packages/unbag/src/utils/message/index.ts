import { useDefaultUserConfigBase } from "@/core/user-config";
import { Locale } from "../common";
import { message as zh_cn_message } from "./zh-cn";
export type Message = typeof zh_cn_message;
const messageMap: Record<Locale, Message> = {
  [Locale.zh_cn]: zh_cn_message,
};
const p = <T extends object>(o: T, d: T): T => {
  const a = new Proxy({} as T, {
    get(_target, property, _receiver) {
      const key = property;
      const value = o[key] || d[key];
      if (typeof value === "object") {
        return p(value, d[key]);
      }
      return value;
    },
  });
  return a;
};

// TODO:改为finalUserConfig
export const useMessage = (params: { locale: Locale }) => {
  const { locale } = params;
  const defaultConfig = useDefaultUserConfigBase();
  const targetMessage = messageMap[locale] || {};
  const defaultMessage = messageMap[defaultConfig.locale];
  return p(targetMessage, defaultMessage);
};
