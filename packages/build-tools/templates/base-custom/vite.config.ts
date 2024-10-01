import { useViteLibConfig } from "unbag-build-tools";
import { mergeConfig } from "vite";
import pkgJson from "./package.json";
import { fileURLToPath } from "node:url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const viteConfig = useViteLibConfig({
  base: __dirname,
  pkgJson,
});

export default mergeConfig(viteConfig, {});
