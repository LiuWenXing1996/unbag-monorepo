import { describe, expect, test } from "vitest";
import { hello } from "./index";

describe("hello", () => {
  test("测试 hello 函数返回值", () => {
    expect(hello()).toEqual("hello");
  });
});
