import * as nodePath from "node:path";
export type NodePathApi = typeof nodePath;
export const createPathUtils = (path: NodePathApi) => {
  const { extname, resolve } = path;
  const trimExtname = (path: string, extnames?: string[]) => {
    let willTrim = true;
    const _extname = extname(path);
    if (extnames) {
      willTrim = extnames.includes(_extname);
    }
    if (willTrim && _extname) {
      return path.slice(0, path.length - _extname.length);
    } else {
      return path;
    }
  };
  const replaceExtname = (path: string, extname: string) => {
    let newPath = trimExtname(path);
    const _extname = extname.startsWith(".") ? extname : `.${extname}`;
    return `${newPath}${_extname}`;
  };
  const rootName = () => {
    return resolve();
  };
  return {
    trimExtname,
    replaceExtname,
    rootName,
    ...path,
  };
};
const pathUtils = createPathUtils(nodePath);
export const usePath = () => {
  const pathUtils = createPathUtils(nodePath);
  return pathUtils;
};
export default pathUtils;
export type IPathUtils = typeof pathUtils;
export class BasePath {
  #content: string;
  constructor(params: { content: string }) {
    const { content } = params;
    this.#content = content;
  }
  get content() {
    return this.#content;
  }
  get extname() {
    return nodePath.extname(this.content);
  }
  replaceExtname(extname: string) {
    const path = usePath();
    const content = path.replaceExtname(this.content, extname);
    return new BasePath({
      content,
    });
  }
}
export class RelativePath extends BasePath {
  constructor(params: { content: string }) {
    const { content } = params;
    if (nodePath.isAbsolute(content)) {
      throw new Error("RelativePath content is absolute path");
    }
    super(params);
  }
  toAbsolutePath(params: { rel: AbsolutePath }) {
    const { rel } = params;
    const absolutePath = nodePath.resolve(rel.content, this.content);
    return new AbsolutePath({
      content: absolutePath,
    });
  }
  replaceExtname(extname: string) {
    const basePath = super.replaceExtname(extname);
    return new RelativePath({
      content: basePath.content,
    });
  }
}
export class AbsolutePath extends BasePath {
  constructor(params: { content: string }) {
    const { content } = params;
    if (!nodePath.isAbsolute(content)) {
      throw new Error("AbsolutePath content must is absolute path");
    }
    super(params);
  }
  toRelativePath(params: { rel: AbsolutePath }) {
    const { rel } = params;
    const content = nodePath.relative(rel.content, this.content);
    return new RelativePath({
      content,
    });
  }
  replaceExtname(extname: string) {
    const basePath = super.replaceExtname(extname);
    return new AbsolutePath({
      content: basePath.content,
    });
  }
  resolve(params: { next: string }) {
    const { next } = params;
    const content = nodePath.resolve(this.content, next);
    return new AbsolutePath({
      content,
    });
  }
}
