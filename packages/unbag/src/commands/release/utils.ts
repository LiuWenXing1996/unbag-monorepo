import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export const resolvePresetPath = (preset: string = "conventional-changelog-conventionalcommits") => {
  const presetPath = require.resolve(preset);
  return presetPath;
};