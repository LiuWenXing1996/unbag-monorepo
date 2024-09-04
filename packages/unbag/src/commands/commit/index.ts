import { FinalUserConfig } from "@/utils/config";
import { gitCz } from "./git-cz";
import { Command } from "@/core/command";

export const commit = async (params: { finalUserConfig: FinalUserConfig }) => {
  const { finalUserConfig } = params;
  await gitCz({ finalUserConfig });
};

export class CommitCommand extends Command {
  async task() {
    const { finalUserConfig } = this;
    await commit({ finalUserConfig });
  }
}
