import { makeTheme } from "@inquirer/core";
import { input, select, confirm } from "@inquirer/prompts";
import i18next from "i18next";

export const usePromptsI18nTheme = () => {
  const defaultTheme = makeTheme({});
  const i18nTheme = makeTheme({
    style: {
      help: (content: string) => {
        const i18nText = i18next.t(`inquirerPrompts.${content}`, "");
        const newContent = i18nText || content;
        return defaultTheme.style.help(newContent);
      },
      error: (content: string) => {
        const i18nText = i18next.t(`inquirerPrompts.${content}`, "");
        const newContent = i18nText || content;
        return defaultTheme.style.error(newContent);
      },
    },
  });

  return i18nTheme;
};

export type Prompts = {
  input: typeof input;
  select: typeof select;
  confirm: typeof confirm;
};

export const usePrompts = (): Prompts => {
  const i18nTheme = usePromptsI18nTheme();
  const wrapperWithDefault = <
    T extends (...rest: unknown[]) => Promise<unknown>
  >(
    func: T
  ): T => {
    const newFunc = async (...rest: any[]) => {
      const [config, ...r] = rest;
      const newConfig = {
        theme: i18nTheme,
        ...config,
      };
      const res = await func(newConfig, ...r);
      return res;
    };
    return newFunc as T;
  };
  return {
    input: wrapperWithDefault(input),
    select: wrapperWithDefault(select),
    confirm: wrapperWithDefault(confirm),
  };
};
