import test from "node:test";
import assert from "assert";
import { lex } from "./lexer";

test("Deferred expression", () => {
  const { tokens } = lex("#{foobar}");
  assert.strictEqual(tokens[0].image, "#{");
  assert.strictEqual(tokens[0].tokenType.name, "StartDeferredExpression");
  assert.strictEqual(tokens[1].image, "foobar");
  assert.strictEqual(tokens[1].tokenType.name, "Identifier");
  assert.strictEqual(tokens[2].image, "}");
  assert.strictEqual(tokens[2].tokenType.name, "RCurl");
});

test("Dynamic expression", () => {
  const { tokens } = lex("${foobar}");
  assert.strictEqual(tokens[0].image, "${");
  assert.strictEqual(tokens[0].tokenType.name, "StartDynamicExpression");
  assert.strictEqual(tokens[1].image, "foobar");
  assert.strictEqual(tokens[1].tokenType.name, "Identifier");
  assert.strictEqual(tokens[2].image, "}");
  assert.strictEqual(tokens[2].tokenType.name, "RCurl");
});
