import { defineCliCommand } from "unbag";

export interface HelloCommand {
  msg: string;
}

export const HelloCommand = defineCliCommand<HelloCommand>({
  useDefaultConfig: () => {
    return {
      msg: "hello,command!",
    };
  },
  defineActions: ({ defineAction }) => {
    return [
      defineAction({
        name: "hello",
        description: "提交文件",
        run: async ({ finalUserConfig }) => {
          console.log(finalUserConfig.commandConfig.msg);
        },
      }),
    ];
  },
});
