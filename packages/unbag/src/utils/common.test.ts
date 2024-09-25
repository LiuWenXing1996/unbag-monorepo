import { expect, test } from "vitest";
import { filterNullable } from "./common";

test("filterNullable", () => {
  expect(filterNullable([])).toEqual([]);
});
