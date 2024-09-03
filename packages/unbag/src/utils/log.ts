import dayjs from "dayjs";
import { FinalUserConfig } from "./config";
import chalk from "chalk";
export enum LogTypeEnum {
  Info = "Info",
  Warn = "Warn",
  Error = "Error",
}
export interface LogConfig {
  disabled: boolean;
  debug?: boolean;
  console: (params: {
    finalUserConfig: FinalUserConfig;
    type: LogTypeEnum;
    message: any;
  }) => void;
}
export const LogConfigDefault: LogConfig = {
  disabled: false,
  console: ({ type, message }) => {
    if (type === LogTypeEnum.Error) {
      console.log(`${chalk.red(`[error]`)}`, message);
    }
    if (type === LogTypeEnum.Info) {
      console.log(message);
    }
    if (type === LogTypeEnum.Warn) {
      console.log(`${chalk.yellow(`[warn]`)}`, message);
    }
  },
};
export const useLog = (params: { finalUserConfig: FinalUserConfig }) => {
  const { finalUserConfig } = params;
  const _console = ({
    type,
    message,
    onlyDebug,
  }: {
    type: LogTypeEnum;
    message: any;
    onlyDebug?: boolean;
  }) => {
    const {
      log: { console, disabled, debug },
    } = finalUserConfig;
    if (disabled) {
      return;
    }
    if (onlyDebug) {
      if (!debug) {
        return;
      }
    }
    console({ finalUserConfig, type, message });
  };
  const info = (message: any) => _console({ type: LogTypeEnum.Info, message });
  const warn = (message: any) => _console({ type: LogTypeEnum.Warn, message });
  const error = (message: any) =>
    _console({ type: LogTypeEnum.Error, message });
  const debug = {
    info: (message: any) =>
      _console({
        type: LogTypeEnum.Info,
        message,
        onlyDebug: true,
      }),
    warn: (message: any) =>
      _console({
        type: LogTypeEnum.Warn,
        message,
        onlyDebug: true,
      }),
    error: (message: any) =>
      _console({
        type: LogTypeEnum.Error,
        message,
        onlyDebug: true,
      }),
  };
  return {
    info,
    warn,
    error,
    debug,
  };
};
