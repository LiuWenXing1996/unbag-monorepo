import { defineUserConfig } from "unbag";
import { RuleConfigSeverity } from "@commitlint/types";
import scopes from "@commitlint/config-pnpm-scopes";
// FIX?
export default defineUserConfig({
  commit: {
    lint: {
      extends: ["@commitlint/config-pnpm-scopes"],
      rules: {
        "scope-empty": [RuleConfigSeverity.Error, "never"],
        // @ts-ignore
        "scope-enum": async (ctx) => {
          const scopeEnum = await scopes.rules["scope-enum"](ctx);
          return [scopeEnum[0], scopeEnum[1], ["root", ...scopeEnum[2]]];
        },
      },
    },
  },
  parallel: {
    commands: [
      {
        name: "unbag",
        npmScript: "pnpm --filter 'unbag' dev",
      },
      {
        name: "unbag-docs",
        npmScript: "pnpm --filter 'unbag-docs' dev",
      },
    ],
  },
});

// import { RuleConfigSeverity, type UserConfig } from "@commitlint/types";
// import scopes from "@commitlint/config-pnpm-scopes";

// const Configuration: UserConfig = {
//   extends: [
//     "@commitlint/config-conventional",
//     "@commitlint/config-pnpm-scopes",
//   ],
//   rules: {
//     "scope-empty": [RuleConfigSeverity.Error, "never"],
//     // @ts-ignore
//     "scope-enum": async (ctx) => {
//       const scopeEnum = await scopes.rules["scope-enum"](ctx);
//       return [scopeEnum[0], scopeEnum[1], ["root", ...scopeEnum[2]]];
//     },
//     // @ts-ignore
//     "type-enum": () => {
//       return [
//         RuleConfigSeverity.Error,
//         "always",
//         [
//           "build",
//           "chore",
//           "ci",
//           "docs",
//           "feat",
//           "fix",
//           "perf",
//           "refactor",
//           "revert",
//           "style",
//           "test",
//           "release",
//         ],
//       ];
//     },
//   },
//   prompt: {
//     questions: {
//       type: {
//         enum: {
//           release: {
//             description: "release sdfsd",
//           },
//         },
//       },
//     },
//   },
// };

// export default Configuration;
