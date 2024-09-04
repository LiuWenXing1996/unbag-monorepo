import {
  deepFreezeConfig,
  FinalUserConfig,
  mergeDefaultConfig,
  UserConfigOptional,
} from "@/utils/config";
import { useLog } from "@/utils/log";
import { MaybePromise } from "@/utils/types";

export abstract class Command {
  #finalUserConfig: FinalUserConfig;
  constructor(config?: UserConfigOptional) {
    const finalUserConfig = mergeDefaultConfig(config);
    const freezedConfig = deepFreezeConfig(finalUserConfig);
    this.#finalUserConfig = freezedConfig;
  }
  get finalUserConfig(): FinalUserConfig {
    return this.#finalUserConfig;
  }
  async run() {
    const { finalUserConfig } = this;

    const log = useLog({ finalUserConfig });
    try {
      await this.task();
    } catch (error) {
      log.catchError(error);
    }
  }
  abstract task(): MaybePromise<void>;
}
