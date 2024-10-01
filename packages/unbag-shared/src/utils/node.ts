import module from "node:module";

export const useCreateNodeRequire = () => {
  return module.createRequire;
};
