import { FinalUserConfig } from "../../utils/config";
import { useFs } from "../../utils/fs";
import { useLog } from "@/utils/log";
import { useMessage } from "../../utils/message";
import { usePath } from "../../utils/path";
import { MaybePromise } from "../../utils/types";
import { useTagPrefix } from "./utils";
import conventionalChangelog from "conventional-changelog";
import { BumpResult } from "./bump";
import type { Stream } from "node:stream";
import type { ParserOptions, WriterOptions } from "conventional-changelog-core";
export interface ReleaseChangelogFileContent {
  header?: string;
  body?: string;
  footer?: string;
}
export interface ReleaseChangelogConfig {
  filePath: string;
  filePathResolve: (params: {
    finalUserConfig: FinalUserConfig;
  }) => MaybePromise<string>;
  fileRead: (params: {
    finalUserConfig: FinalUserConfig;
  }) => MaybePromise<ReleaseChangelogFileContent>;
  fileWriteDisable?: boolean;
  fileWrite: (params: {
    finalUserConfig: FinalUserConfig;
    changelogRes: ReleaseChangelogFileContent;
  }) => MaybePromise<void>;
  logAddChangesetDisable?: boolean;
  scopeNoWriteDisable?: boolean;
  genParserOpts?: () => MaybePromise<ParserOptions>;
  genWriterOpts?: () => MaybePromise<WriterOptions>;
  header?: string;
  footer?: string;
}
export const ReleaseChangelogConfigDefault: ReleaseChangelogConfig = {
  filePath: "CHANGELOG.md",
  filePathResolve: async ({ finalUserConfig }) => {
    const {
      root,
      release: {
        changelog: { filePath },
      },
    } = finalUserConfig;
    const path = usePath();
    const absolutePath = path.resolve(root, filePath);
    return absolutePath;
  },
  fileRead: async ({ finalUserConfig }) => {
    const {
      release: {
        changelog: { filePathResolve },
      },
    } = finalUserConfig;
    const changelogFileAbsolutePath = await filePathResolve({
      finalUserConfig,
    });
    const fs = useFs();
    const fileExist = await fs.pathExists(changelogFileAbsolutePath);
    const content = fileExist
      ? await fs.readFile(changelogFileAbsolutePath, "utf-8")
      : "";
    return changelogContentParser(content);
  },
  fileWrite: async ({ finalUserConfig, changelogRes }) => {
    const {
      release: {
        changelog: { filePathResolve },
      },
    } = finalUserConfig;
    const changelogFileAbsolutePath = await filePathResolve({
      finalUserConfig,
    });
    const fs = useFs();
    const changelogContent = changelogContentStringify(changelogRes);
    await fs.outputFile(changelogFileAbsolutePath, changelogContent);
  },
};
const streamToString = (stream: Stream): Promise<string> => {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
};
const ChangelogHeaderDividerTag =
  "\n\n[comment]: # (!!!ChangelogHeaderDividerTag!!!)\n\n";
const ChangelogFooterDividerTag =
  "\n\n[comment]: # (!!!ChangelogFooterDividerTag!!!)\n\n";
export const changelogContentParser = (
  content: string
): ReleaseChangelogFileContent => {
  const result: ReleaseChangelogFileContent = {};
  const headerIndex = content.indexOf(ChangelogHeaderDividerTag);
  const footerIndex = content.indexOf(ChangelogFooterDividerTag);
  if (headerIndex > -1) {
    result.header = content.substring(0, headerIndex);
  }
  result.body = content.substring(
    headerIndex > -1 ? ChangelogHeaderDividerTag.length + headerIndex : 0,
    footerIndex > -1 ? footerIndex : undefined
  );
  if (footerIndex > -1) {
    result.footer = content.substring(
      footerIndex + ChangelogHeaderDividerTag.length
    );
  }
  return result;
};
export const changelogContentStringify = (
  content: ReleaseChangelogFileContent
) => {
  const { body, header, footer } = content;
  return (
    "" +
    (header || "") +
    ChangelogHeaderDividerTag +
    (body || "") +
    ChangelogFooterDividerTag +
    (footer || "")
  );
};
export const changelog = async (params: {
  finalUserConfig: FinalUserConfig;
  bumpRes: BumpResult;
}) => {
  const { finalUserConfig, bumpRes } = params;
  const log = useLog({ finalUserConfig });
  const message = useMessage({
    locale: finalUserConfig.locale,
  });
  log.info(message.release.changelog.generating());
  const {
    release: {
      dry,
      scope,
      preset,
      changelog: {
        fileRead,
        header,
        footer,
        fileWrite,
        fileWriteDisable,
        logAddChangesetDisable,
        scopeNoWriteDisable,
        genParserOpts,
        genWriterOpts,
      },
    },
  } = finalUserConfig;
  const tagPrefix = await useTagPrefix({ finalUserConfig });
  const parserOpts = await genParserOpts?.();
  const writerOpts = await genWriterOpts?.();
  const conventionalChangelogStream = conventionalChangelog(
    {
      //@ts-ignore
      preset: {
        name: preset.path,
        ...preset.params,
      },
      tagPrefix,
      transform: (commit, cb) => {
        if (scope?.name) {
          if (commit.scope === scope.name) {
            if (!scopeNoWriteDisable) {
              commit.scope = undefined;
            }
            cb(null, commit);
          } else {
            //@ts-ignore
            cb(null, undefined);
          }
        } else {
          cb(null, commit);
        }
      },
    },
    {
      version: bumpRes.version,
    },
    undefined,
    parserOpts,
    writerOpts
  );
  const newChangeset = await streamToString(conventionalChangelogStream);
  const oldContent = await fileRead({
    finalUserConfig,
  });
  const newContent: ReleaseChangelogFileContent = {
    header,
    footer,
    body: "" + newChangeset + "\n" + (oldContent?.body || ""),
  };
  let _fileWriteDisable = fileWriteDisable;
  if (dry) {
    _fileWriteDisable = true;
    log.warn(message.release.dry.changelog.fileWriteDisable());
  }
  if (!logAddChangesetDisable) {
    log.warn(message.release.changelog.newChangeset({ newChangeset }));
  }
  if (!_fileWriteDisable) {
    log.info(message.releaseChangelogFileWriting());
    await fileWrite({
      finalUserConfig,
      changelogRes: newContent,
    });
    log.info(message.releaseChangelogFileWriteSuccess());
  } else {
    log.warn(message.releaseChangelogFileWriteDisable());
  }
  return newContent;
};
