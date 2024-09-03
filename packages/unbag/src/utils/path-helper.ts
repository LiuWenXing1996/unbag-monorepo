export const pathHelper = {
  rootName: () => {
    return (deps: {
      resolve: (...pathSegments: string[]) => string;
    }) => {
      const {
        resolve
      } = deps;
      return resolve();
    };
  }
};