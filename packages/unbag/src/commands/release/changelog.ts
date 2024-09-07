import { FinalUserConfig } from "../../utils/config";
import { useFs } from "../../utils/fs";
import { useLog } from "@/utils/log";
import { useMessage } from "../../utils/message";
import { usePath } from "../../utils/path";
import { MaybePromise } from "../../utils/types";
import { resolvePresetPath } from "./utils";
import conventionalChangelog from "conventional-changelog";
export interface ReleaseChangelogFileContent {
  header?: string;
  body?: string;
  footer?: string;
}
export interface ReleaseChangelogConfig {
  filePath: string;
  filePathResolve: (params: {
    config: FinalUserConfig;
  }) => MaybePromise<string>;
  fileRead: (params: {
    config: FinalUserConfig;
  }) => MaybePromise<ReleaseChangelogFileContent>;
  fileWriteDisable?: boolean;
  fileWrite: (params: {
    config: FinalUserConfig;
    changelogRes: ReleaseChangelogFileContent;
  }) => MaybePromise<void>;
  header?: string;
  footer?: string;
}
export const ReleaseChangelogConfigDefault: ReleaseChangelogConfig = {
  filePath: "CHANGELOG.md",
  filePathResolve: async ({ config }) => {
    const {
      root,
      release: {
        changelog: { filePath },
      },
    } = config;
    const path = usePath();
    const absolutePath = path.resolve(root, filePath);
    return absolutePath;
  },
  fileRead: async ({ config }) => {
    const {
      release: {
        changelog: { filePathResolve },
      },
    } = config;
    const changelogFileAbsolutePath = await filePathResolve({
      config,
    });
    const fs = useFs();
    const fileExist = await fs.pathExists(changelogFileAbsolutePath);
    const content = fileExist
      ? await fs.readFile(changelogFileAbsolutePath, "utf-8")
      : "";
    return changelogContentParser(content);
  },
  fileWrite: async ({ config, changelogRes }) => {
    const {
      release: {
        changelog: { filePathResolve },
      },
    } = config;
    const changelogFileAbsolutePath = await filePathResolve({
      config,
    });
    const fs = useFs();
    const changelogContent = changelogContentStringify(changelogRes);
    await fs.outputFile(changelogFileAbsolutePath, changelogContent);
  },
};
function streamToString(stream) {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}
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
export const changelog = async ({ config }: { config: FinalUserConfig }) => {
  const log = useLog({ finalUserConfig: config });
  const message = useMessage({
    locale: config.locale,
  });
  log.info(message.releaseChangelogGenerating());
  const {
    release: {
      tag: { prefix: tagPrefix },
      changelog: { fileRead, header, footer, fileWrite, fileWriteDisable },
    },
  } = config;

  // TODO：此处需要过滤 scope
  log.debug({ tagPrefix });
  const conventionalChangelogStream = conventionalChangelog({
    preset: resolvePresetPath(),
    tagPrefix,
  });
  const newChangeset = await streamToString(conventionalChangelogStream);

  const oldContent = await fileRead({
    config,
  });

  const newContent: ReleaseChangelogFileContent = {
    header,
    footer,
    body: "" + newChangeset + "\n" + (oldContent?.body || ""),
  };
  if (!fileWriteDisable) {
    log.info(message.releaseChangelogFileWriting());
    await fileWrite({
      config,
      changelogRes: newContent,
    });
    log.info(message.releaseChangelogFileWriteSuccess());
  } else {
    log.warn(message.releaseChangelogFileWriteDisable());
  }
  return newContent;
};
