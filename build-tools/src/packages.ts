import path from "node:path";
import fs from "node:fs/promises";

export const listChildDir = async (dir?: string) => {
  const dirs: string[] = [];
  if (!dir) {
    return [];
  }
  const fileList = (await fs.readdir(dir)) as string[];
  for (const file of fileList) {
    const name = path.join(dir, file);
    if ((await fs.stat(name)).isDirectory()) {
      dirs.push(name);
    }
  }
  return dirs;
};

export const readJson = async <T>(path: string): Promise<T> => {
  let jsonObj: T | undefined = undefined;
  const content = (await fs.readFile(path, "utf-8")) as string;
  jsonObj = JSON.parse(content || "") as T;
  return jsonObj;
};

export enum PackageType {
  "Main" = "Main",
  "Docs" = "Docs",
  "Root" = "Root",
  "BuildTools" = "BuildTools",
}

export interface PkgJson {
  name: string;
  private?: boolean;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface Package {
  name: string;
  type: PackageType;
  dir: string;
  pkgJson: PkgJson;
  depsDir: string;
  buildResources: string[];
}

export const resolvePackage = async (params: {
  packageDir: string;
  type: PackageType;
}): Promise<Package> => {
  const { packageDir, type } = params;
  if (!path.isAbsolute(packageDir)) {
    throw new Error(`${packageDir} 不是绝对路径`);
  }

  const pkgJsonPath = path.resolve(packageDir, "./package.json");
  const pkgJson = await readJson<PkgJson>(pkgJsonPath);
  const buildResources: string[] = [path.resolve(packageDir, "./dist")];
  const pkg: Package = {
    name: pkgJson.name,
    pkgJson,
    type,
    dir: packageDir,
    depsDir: path.resolve(packageDir, "./node_modules"),
    buildResources,
  };

  return pkg;
};

export const resolvePackages = async (params: {
  root: string;
}): Promise<Package[]> => {
  const { root } = params;
  if (!path.isAbsolute(root)) {
    throw new Error(`${root} 不是绝对路径`);
  }
  const packages: Package[] = [];

  // 主要项目
  {
    const mainPackagesDir = path.resolve(root, "./packages");
    const mainPackageDirList = await listChildDir(mainPackagesDir);
    const mainPackages: Package[] = await Promise.all([
      ...mainPackageDirList.map(async (packageDir) => {
        return await resolvePackage({ packageDir, type: PackageType.Main });
      }),
    ]);
    packages.push(...mainPackages);
  }
  // 根项目
  {
    const rootPackage = await resolvePackage({
      packageDir: path.resolve(root),
      type: PackageType.Root,
    });
    packages.push({
      ...rootPackage,
      buildResources: [],
    });
  }
  // docs
  {
    const docsPackage = await resolvePackage({
      packageDir: path.resolve(root, "./docs"),
      type: PackageType.Docs,
    });
    packages.push({
      ...docsPackage,
      buildResources: [path.resolve(docsPackage.dir, "./.vitepress/dist")],
    });
  }
  // build-tools
  {
    const docsPackage = await resolvePackage({
      packageDir: path.resolve(root, "./build-tools"),
      type: PackageType.BuildTools,
    });
    packages.push({
      ...docsPackage,
    });
  }
  return packages;
};

export class DepsGraph {
  #graph = new Map<string, string[]>();
  hasPkg(pkgName: string) {
    return this.#graph.has(pkgName);
  }
  addPkg(pkgName: string) {
    if (this.hasPkg(pkgName)) {
      return;
    }
    this.#graph.set(pkgName, []);
  }
  hasDep(pkgName: string, depPkgName: string) {
    return this.#graph.get(pkgName)?.includes(depPkgName);
  }
  addDep(pkgName: string, depPkgName: string) {
    if (this.hasDep(pkgName, depPkgName)) {
      return;
    }
    this.addPkg(pkgName);
    this.addPkg(depPkgName);
    const deps = this.#graph.get(pkgName) || [];
    deps.push(depPkgName);
    this.#graph.set(pkgName, [...deps]);
  }
  findCircle() {
    const graph = this.#graph;
    const visitingVertex = new Set<string>();
    const visitedVertex = new Set<string>();

    const hasCircle = (vertex: string) => {
      const edgeVertexList = graph.get(vertex);
      visitingVertex.add(vertex);
      if (edgeVertexList && edgeVertexList.length > 0) {
        for (const edgeVertex of edgeVertexList) {
          if (visitedVertex.has(edgeVertex)) {
            // 如果已经访问了这个节点 那么就跳出这个循环
            continue;
          } else if (visitingVertex.has(edgeVertex)) {
            // 如果同时也访问了 edgeVertex 表示在遍历 vertex 的边时 有一条指向 vertex 的后退边
            return true;
          } else if (hasCircle(edgeVertex)) {
            // 深度遍历 edgeVertex 的顶点时 发现有指向 edgeVertex 的后退边
            return true;
          }
        }
      }
      visitedVertex.add(vertex); // 标注已经访问过这个节点
      return false;
    };

    for (const [vertex] of graph) {
      if (hasCircle(vertex)) {
        return true;
      }
    }
    return false;
  }
  sortByDeps() {
    const hasCircle = this.findCircle();
    if (hasCircle) {
      throw new Error("有循环依赖");
    }
    const graph = this.#graph;
    const pkgs = Array.from(this.#graph.keys());
    const sortedPkgs = pkgs.toSorted((a, b) => {
      if (graph.get(a)?.includes(b)) {
        return 1;
      }

      if (graph.get(b)?.includes(a)) {
        return -1;
      }
      return 0;
    });
    return sortedPkgs;
  }
}

export const createDepsGraph = (params: { packages: Package[] }) => {
  const { packages } = params;
  const depsGraph = new DepsGraph();
  const packageNames = packages.map((pkg) => pkg.name);
  for (const pkg of packages) {
    depsGraph.addPkg(pkg.name);
    const deps = Array.from(
      new Set([
        ...Object.keys(pkg.pkgJson.dependencies || {}),
        ...Object.keys(pkg.pkgJson.peerDependencies || {}),
      ])
    ).filter((dep) => packageNames.includes(dep));
    for (const dep of deps) {
      depsGraph.addDep(pkg.name, dep);
    }
  }

  return depsGraph;
};
