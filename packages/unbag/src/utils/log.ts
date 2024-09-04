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
  catchError: (error: any) => void;
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
  catchError: () => {},
};
export const useLog = (params: { finalUserConfig: FinalUserConfig }) => {
  const { finalUserConfig } = params;
  const _console = (p: {
    type: LogTypeEnum;
    message: any;
    onlyDebug?: boolean;
  }) => {
    const { type, message, onlyDebug } = p;
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
  const errorAndThrow = (message: any) => {
    _console({ type: LogTypeEnum.Error, message });
    throw new Error(message);
  };
  const catchError = (error: any) => {
    const {
      log: { catchError: ce },
    } = finalUserConfig;
    ce(error);
  };
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
    errorAndThrow,
    catchError,
    debug,
  };
};
