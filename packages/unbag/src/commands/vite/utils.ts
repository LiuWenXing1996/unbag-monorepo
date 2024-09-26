import { AbsolutePath, usePath } from "@/utils/path";
import type { ViteConfig } from "./index";
import dts from "vite-plugin-dts";

export const useViteLibConfig = (params: {
  base: AbsolutePath;
  pkgJson: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
}): ViteConfig => {
  const { pkgJson, base } = params;
  const baseValue = base.content;
  const externals = [
    ...Object.keys(pkgJson.dependencies || []),
    ...Object.keys(pkgJson.devDependencies || []),
  ];
  const path = usePath();
  return {
    resolve: {
      alias: {
        "@": path.resolve(baseValue, "./src"),
      },
    },
    plugins: [
      dts({
        entryRoot: path.resolve(baseValue, "./src"),
        outDir: path.resolve(baseValue, "./dist/types"),
        rollupTypes: false,
      }),
    ],
    test: {},
    build: {
      sourcemap: true,
      lib: {
        entry: path.resolve(baseValue, "./src/index.ts"),
        name: "unbag",
        formats: ["es", "cjs"],
        fileName: (format) => {
          if (["es", "esm"].includes(format)) {
            return `esm/index.mjs`;
          }
          if (["cjs"].includes(format)) {
            return `cjs/index.cjs`;
          }
          throw Error(`unknown format`);
        },
      },
      rollupOptions: {
        external: (id: string) => {
          if (id.startsWith("node:")) {
            return true;
          }
          return externals.some(
            (pkg) => id === pkg || id.startsWith(`${pkg}/`)
          );
        },
      },
    },
  };
};

export const useVite = async (): Promise<typeof import("vite")> => {
  const vite = await import("vite");
  return vite;
};

export const useVitest = async (): Promise<typeof import("vitest")> => {
  const vitest = await import("vitest");
  return vitest;
};
