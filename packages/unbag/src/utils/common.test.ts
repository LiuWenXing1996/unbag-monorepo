import { expect, test, describe } from "vitest";
import { filterNullable, arraify, sleep } from "./common";

describe("filterNullable", () => {
  test("过滤默认的空值", () => {
    expect(filterNullable([undefined, null, 0, "", false, true])).toEqual([
      true,
    ]);
  });

  test("使用自定义函数过滤默认的空值", () => {
    expect(
      filterNullable([undefined, null, 0, "", false, true], (v) => {
        return v === undefined;
      })
    ).toEqual([null, 0, "", false, true]);
  });
});

describe("arraify", () => {
  test("数组转为数组", () => {
    expect(arraify([1])).toEqual([1]);
  });
  test("单值转为数组", () => {
    expect(arraify(1)).toEqual([1]);
  });
  test("不会对数组进行深入转换", () => {
    expect(arraify([[1]])).toEqual([[1]]);
  });
});