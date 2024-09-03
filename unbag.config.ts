import { defineUserConfig } from "unbag";
// FIX?
export default defineUserConfig({
  parallel: {
    commands: [
      {
        name: "unbag",
        npmScript: "pnpm --filter 'unbag' dev",
      },
      {
        name: "unbag-docs",
        npmScript: "pnpm --filter 'unbag-docs' dev",
      },
    ],
  },
});
