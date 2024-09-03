import { FinalUserConfig } from "@/utils/config";
import { gitCz } from "./git-cz";

export const commit = async (params: { finalUserConfig: FinalUserConfig }) => {
  const { finalUserConfig } = params;
  await gitCz({ finalUserConfig });
};
