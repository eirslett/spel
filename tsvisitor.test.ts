import ts from "typescript";
import test from "node:test";
import assert from "assert";
import { toTypeScript } from "./tsvisitor";

// Take the TypeScript AST and format/print as code to a string
function print(ast): string {
  const processedAst = ts.factory.createExpressionStatement(ast);

  const finished = ts.factory.createSourceFile(
    [ast],
    ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None
  );

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  let result = printer
    .printNode(ts.EmitHint.Unspecified, finished, undefined)
    .trim();
  return result;
}

test("Deferred expression", () => {
  const result = toTypeScript("#{foobar}");
  assert.deepEqual(print(result), "foobar");
});

test("Three expressions with some literal in it", () => {
  const result = toTypeScript("#{one}${two}three#{four}");
  assert.deepEqual(print(result), `one + two + "three" + four`);
});

test("Dynamic expression", () => {
  const result = toTypeScript("${trueText}");
  assert.deepEqual(print(result), `trueText`);
});

test("Boolean literal expression (true)", () => {
  const result = toTypeScript("#{true}");
  assert.deepEqual(print(result), `true`);
});

test("Literal integer expression", () => {
  const result = toTypeScript("#{123}");
  assert.deepEqual(print(result), `123`);
});

test("String literal expression (double quote)", () => {
  const result = toTypeScript('#{"apple"}');
  assert.deepEqual(print(result), `"apple"`);
});

test("String literal expression (single quote)", () => {
  const result = toTypeScript("#{'apple'}");
  assert.deepEqual(print(result), `"apple"`);
});

test("Literal expression (string)", () => {
  const result = toTypeScript("volkswagen");
  assert.deepEqual(print(result), `"volkswagen"`);
});

test("Binary expression", () => {
  const result = toTypeScript("#{2 > 1}");
  assert.deepEqual(print(result), `2 > 1`);
});

test("Binary expression (equals)", () => {
  const result = toTypeScript("#{1 == 2}");
  assert.deepEqual(print(result), `1 === 2`);
});

test("Ternary expression", () => {
  const result = toTypeScript("#{true ? 1 : 2}");
  assert.deepEqual(print(result), `true ? 1 : 2`);
});

test("Property access", () => {
  const result = toTypeScript("#{a.b.c}");
  assert.deepEqual(print(result), `a.b.c`);
});

test("not-expression", () => {
  const result = toTypeScript("#{not a}");
  assert.deepEqual(print(result), `!a`);
});

test("empty-expression", () => {
  const result = toTypeScript("#{empty a}");
  assert.deepEqual(print(result), `isEmpty(a)`);
});

test("Illegal expression (not terminated)", () => {
  assert.throws(() => toTypeScript("#{foobar"));
});

test("Complicated expression", () => {
  const result = toTypeScript("#{foobar && 123 ? 1 : 2 == a.b.c}");
  assert.deepEqual(print(result), `foobar && (123 ? 1 : 2 === a.b.c)`);
});
