import { defineUserConfig, useCommand } from "unbag";
import { CreateCommand } from "./src";

export default defineUserConfig({
  commands: [useCommand(CreateCommand)],
});
