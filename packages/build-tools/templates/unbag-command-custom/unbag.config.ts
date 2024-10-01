import { defineUserConfig, useCliCommand } from "unbag";
import { HelloCommand } from "./src/index";

export default defineUserConfig({
  commands: [
    useCliCommand(HelloCommand, {
      msg: "hello!",
    }),
  ],
});
