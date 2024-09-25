import module from "node:module";

export const useCreateRequire = () => {
  return module.createRequire;
};
