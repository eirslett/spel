import test from "node:test";
import assert from "assert";
import { parse } from "./parser";

test("Deferred expression", () => {
  const result = parse("#{foobar}");
  console.log(result);
});

test("Dynamic expression", () => {
  const result = parse("${foobar}");
  console.log(result);
});
