import { defineUserConfig, useCliCommand } from "unbag";
import { CreateCommand } from "./src";

export default defineUserConfig({
  commands: [useCliCommand(CreateCommand)],
});
