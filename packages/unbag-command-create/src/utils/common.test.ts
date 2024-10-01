import { expect, test, describe } from "vitest";
import { useInlineTemplates } from "./common";

describe("useInlineTemplates", () => {
  test("找到一个以上模板", async () => {
    const templates = await useInlineTemplates();
    expect(templates.length > 0).toBeTruthy();
  });
});
