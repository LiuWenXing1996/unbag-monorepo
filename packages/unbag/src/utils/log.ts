import { FinalUserConfig } from "@/config";
import chalk from "chalk";
export enum LogTypeEnum {
  Info = "Info",
  Warn = "Warn",
  Error = "Error",
  Debug = "Debug",
}
export interface LogConfig {
  disabled: boolean;
  debug?: boolean;
  console: (params: {
    finalUserConfig: FinalUserConfig;
    type: LogTypeEnum;
    message: any;
  }) => void;
  catchThrowError: (error: any) => void;
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
    if (type === LogTypeEnum.Debug) {
      console.log(`${chalk.green(`[debug]`)}`, message);
    }
  },
  catchThrowError: () => {},
};
export const useLog = (params: { finalUserConfig: FinalUserConfig }) => {
  const { finalUserConfig } = params;
  const _console = (p: { type: LogTypeEnum; message: any }) => {
    const { type, message } = p;
    const {
      base: {
        log: { console, disabled, debug },
      },
    } = finalUserConfig;
    if (disabled) {
      return;
    }
    if (type === LogTypeEnum.Debug) {
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
  const debug = (message: any) =>
    _console({ type: LogTypeEnum.Debug, message });
  const resolveMessageFromError = (error: any): string | void => {
    return error?.message || error?.msg;
  };
  const catchThrowError = (e: any) => {
    const {
      base: {
        log: { catchThrowError: cte },
      },
    } = finalUserConfig;
    const message = resolveMessageFromError(e);
    error(message || "unknown error");
    cte(e);
  };

  return {
    info,
    warn,
    error,
    debug,
    catchThrowError,
  };
};

export const wrapAsyncFuncWithLog = <
  T extends (...rest: unknown[]) => Promise<unknown>
>(params: {
  finalUserConfig: FinalUserConfig;
  func: T;
}): T => {
  const { finalUserConfig, func } = params;
  const newFunc = async (...rest: any[]) => {
    const log = useLog({ finalUserConfig });
    try {
      return await func(...rest);
    } catch (error) {
      log.catchThrowError(error);
      process.exit(1);
    }
  };
  return newFunc as T;
};
