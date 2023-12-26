import { lex } from "./lexer";
// re-using the parser implemented in step two.
import { ELParser } from "./parser";

// A new parser instance with CST output (enabled by default).
const parserInstance = new ELParser();
// The base visitor class can be accessed via the a parser instance.
const BaseVisitor = parserInstance.getBaseCstVisitorConstructor();

class ELtoASTVisitor extends BaseVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  compositeExpressionItem(ctx) {
    return this.visit(Object.entries(ctx)[0][1][0]);
  }

  deferredExpression(ctx) {
    return {
      type: "DeferredExpression",
      value: this.visit(ctx.expression[0]),
    };
  }

  dynamicExpression(ctx) {
    return {
      type: "DynamicExpression",
      value: this.visit(ctx.expression[0]),
    };
  }

  compositeExpression(ctx) {
    return {
      type: "CompositeExpression",
      values: ctx.compositeExpressionItem.map((expr) => this.visit(expr)),
    };
  }

  literalExpression(ctx) {
    return {
      type: "LiteralExpression",
      value: ctx.LiteralExpression[0].image,
    };
  }

  valuePrefix(ctx) {
    return this.visit(Object.entries(ctx)[0][1][0]);
  }

  valueSuffix(ctx) {
    return this.visit(
      Object.entries(ctx).find(([key, value]) => key !== "Dot")[1][0]
    );
  }

  value(ctx) {
    if (ctx.valueSuffix) {
      let result = this.visit(ctx.valuePrefix[0]);
      for (const suffix of ctx.valueSuffix) {
        result = {
          type: "PropertyAccessExpression",
          value: result,
          property: this.visit(suffix),
        };
      }
      return result;
    } else {
      return this.visit(ctx.valuePrefix[0]);
    }
  }

  expression(ctx) {
    if (ctx.ternary) {
      return {
        type: "TernaryExpression",
        condition: this.visit(
          Object.entries(ctx).find(
            ([key, value]) =>
              !["ternary", "Colon", "consequent", "alternate"].includes(key)
          )[1][0]
        ),
        consequent: this.visit(ctx.consequent[0]),
        alternate: this.visit(ctx.alternate[0]),
      };
    } else if (ctx.binaryExpressionSuffix) {
      return {
        ...this.visit(ctx.binaryExpressionSuffix[0]),
        left: this.visit(ctx.lhs[0]),
      };
    } else if (ctx.lhs) {
      return this.visit(ctx.lhs[0]);
    } else {
      throw Error("Unknown expression type in " + Object.keys(ctx).join(","));
    }
  }

  binaryExpressionSuffix(ctx) {
    return {
      type: "BinaryExpression",
      operator: ctx.binaryOperator[0].tokenType.name.toLowerCase(),
      right: this.visit(ctx.rhs[0]),
    };
  }

  unaryExpression(ctx) {
    return {
      type: "UnaryExpression",
      operator: ctx.operator[0].tokenType.name.toLowerCase(),
      value: this.visit(ctx.expression[0]),
    };
  }

  identifier(ctx) {
    return {
      type: "Identifier",
      value: ctx.Identifier[0].image,
    };
  }

  booleanLiteral(ctx) {
    return {
      type: "BooleanLiteral",
      value: ctx.BooleanLiteral[0].image === "true",
    };
  }

  integerLiteral(ctx) {
    return {
      type: "IntegerLiteral",
      value: Number.parseInt(ctx.IntegerLiteral[0].image, 10),
    };
  }

  stringLiteral(ctx) {
    const value = (ctx.DoubleQuoteStringLiteral ??
      ctx.SingleQuoteStringLiteral)[0].image;
    return {
      type: "StringLiteral",
      value: value.substring(1, value.length - 1),
    };
  }
}

const toAstVisitorInstance = new ELtoASTVisitor();

export function toAstVisitor(inputText) {
  const lexResult = lex(inputText);

  // ".input" is a setter which will reset the parser's internal's state.
  parserInstance.input = lexResult.tokens;

  // Automatic CST created when parsing
  const cst = parserInstance.compositeExpression();

  if (parserInstance.errors.length > 0) {
    throw Error(
      "Sad sad panda, parsing errors detected!\n" +
        parserInstance.errors[0].message
    );
  }

  const ast = toAstVisitorInstance.visit(cst);

  return ast;
}
