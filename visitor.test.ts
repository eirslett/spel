import test from "node:test";
import assert from "assert";
import { toAstVisitor } from "./visitor";

test("Deferred expression", () => {
  const result = toAstVisitor("#{foobar}");
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "DeferredExpression",
        value: {
          type: "Identifier",
          value: "foobar",
        },
      },
    ],
  });
});

test("Three expressions with some literal in it", () => {
  const result = toAstVisitor("#{one}${two}three#{four}");
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "DeferredExpression",
        value: {
          type: "Identifier",
          value: "one",
        },
      },
      {
        type: "DynamicExpression",
        value: {
          type: "Identifier",
          value: "two",
        },
      },
      {
        type: "LiteralExpression",
        value: "three",
      },
      {
        type: "DeferredExpression",
        value: {
          type: "Identifier",
          value: "four",
        },
      },
    ],
  });
});

test("Dynamic expression", () => {
  const result = toAstVisitor("${trueText}");
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "DynamicExpression",
        value: {
          type: "Identifier",
          value: "trueText",
        },
      },
    ],
  });
});

test("Boolean literal expression (true)", () => {
  const result = toAstVisitor("#{true}");
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "DeferredExpression",
        value: {
          type: "BooleanLiteral",
          value: true,
        },
      },
    ],
  });
});

test("Literal integer expression", () => {
  const result = toAstVisitor("#{123}");
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "DeferredExpression",
        value: {
          type: "IntegerLiteral",
          value: 123,
        },
      },
    ],
  });
});

test("String literal expression (double quote)", () => {
  const result = toAstVisitor('#{"apple"}');
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "DeferredExpression",
        value: {
          type: "StringLiteral",
          value: "apple",
        },
      },
    ],
  });
});

test("String literal expression (single quote)", () => {
  const result = toAstVisitor("#{'apple'}");
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "DeferredExpression",
        value: {
          type: "StringLiteral",
          value: "apple",
        },
      },
    ],
  });
});

test("Literal expression (string)", () => {
  const result = toAstVisitor("volkswagen");
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "LiteralExpression",
        value: "volkswagen",
      },
    ],
  });
});

test("Binary expression", () => {
  const result = toAstVisitor("#{2 > 1}");
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "DeferredExpression",
        value: {
          left: {
            type: "IntegerLiteral",
            value: 2,
          },
          operator: "gt",
          right: {
            type: "IntegerLiteral",
            value: 1,
          },
          type: "BinaryExpression",
        },
      },
    ],
  });
});

test("Binary expression (equals)", () => {
  const result = toAstVisitor("#{1 == 2}");
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "DeferredExpression",
        value: {
          left: {
            type: "IntegerLiteral",
            value: 1,
          },
          operator: "eq",
          right: {
            type: "IntegerLiteral",
            value: 2,
          },
          type: "BinaryExpression",
        },
      },
    ],
  });
});

test("Ternary expression", () => {
  const result = toAstVisitor("#{true ? 1 : 2}");
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "DeferredExpression",
        value: {
          type: "TernaryExpression",
          condition: {
            type: "BooleanLiteral",
            value: true,
          },
          consequent: {
            type: "IntegerLiteral",
            value: 1,
          },
          alternate: {
            type: "IntegerLiteral",
            value: 2,
          },
        },
      },
    ],
  });
});

test("Property access", () => {
  const result = toAstVisitor("#{a.b.c}");
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "DeferredExpression",
        value: {
          property: {
            type: "Identifier",
            value: "c",
          },
          type: "PropertyAccessExpression",
          value: {
            property: {
              type: "Identifier",
              value: "b",
            },
            type: "PropertyAccessExpression",
            value: {
              type: "Identifier",
              value: "a",
            },
          },
        },
      },
    ],
  });
});

test("not-expression", () => {
  const result = toAstVisitor("#{not a}");
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "DeferredExpression",
        value: {
          type: "UnaryExpression",
          operator: "not",
          value: {
            type: "Identifier",
            value: "a",
          },
        },
      },
    ],
  });
});

test("empty-expression", () => {
  const result = toAstVisitor("#{empty a}");
  assert.deepEqual(result, {
    type: "CompositeExpression",
    values: [
      {
        type: "DeferredExpression",
        value: {
          type: "UnaryExpression",
          operator: "empty",
          value: {
            type: "Identifier",
            value: "a",
          },
        },
      },
    ],
  });
});

test("Illegal expression (not terminated)", () => {
  assert.throws(() => toAstVisitor("#{foobar"));
});

test("Complicated expression", () => {
  assert.doesNotThrow(() => toAstVisitor("#{foobar && 123 ? 1 : 2 == a.b.c}"));
});
