import ts from "typescript";
import { lex } from "./lexer";
// re-using the parser implemented in step two.
import { ELParser } from "./parser";

// A new parser instance with CST output (enabled by default).
const parserInstance = new ELParser();
// The base visitor class can be accessed via the a parser instance.
const BaseVisitor = parserInstance.getBaseCstVisitorConstructor();

class ELToTypeScriptVisitor extends BaseVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  compositeExpressionItem(ctx) {
    return this.visit(Object.entries(ctx)[0][1][0]);
  }

  deferredExpression(ctx) {
    return this.visit(ctx.expression[0]);
  }

  dynamicExpression(ctx) {
    return this.visit(ctx.expression[0]);
  }

  compositeExpression(ctx) {
    const items = ctx.compositeExpressionItem.map((expr) => this.visit(expr));

    let result = items[0];

    for (let i = 1; i < items.length; i++) {
      result = ts.factory.createBinaryExpression(
        result,
        ts.factory.createToken(ts.SyntaxKind.PlusToken),
        items[i]
      );
    }

    return result;
  }

  literalExpression(ctx) {
    return ts.factory.createStringLiteral(ctx.LiteralExpression[0].image);
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
        result = ts.factory.createPropertyAccessExpression(
          result,
          this.visit(suffix)
        );
      }
      return result;
    } else {
      return this.visit(ctx.valuePrefix[0]);
    }
  }

  expression(ctx) {
    if (ctx.ternary) {
      return ts.factory.createConditionalExpression(
        this.visit(
          Object.entries(ctx).find(
            ([key, value]) =>
              !["ternary", "Colon", "consequent", "alternate"].includes(key)
          )[1][0]
        ),
        ts.factory.createToken(ts.SyntaxKind.QuestionToken),
        this.visit(ctx.consequent[0]),
        ts.factory.createToken(ts.SyntaxKind.ColonToken),
        this.visit(ctx.alternate[0])
      );
    } else if (ctx.binaryExpressionSuffix) {
      const { operator, right } = this.visit(ctx.binaryExpressionSuffix[0]);

      let token;
      switch (operator) {
        case "+":
          token = ts.SyntaxKind.PlusToken;
          break;
        case "-":
          token = ts.SyntaxKind.MinusToken;
          break;
        case "gt":
          token = ts.SyntaxKind.GreaterThanToken;
          break;
        case "lt":
          token = ts.SyntaxKind.LessThanToken;
          break;
        case "eq":
          token = ts.SyntaxKind.EqualsEqualsEqualsToken;
          break;
        case "neq":
          token = ts.SyntaxKind.ExclamationEqualsEqualsToken;
          break;
        case "and":
          token = ts.SyntaxKind.AmpersandAmpersandToken;
          break;
        case "or":
          token = ts.SyntaxKind.BarBarToken;
          break;
        default:
          throw Error(`Unknown operator for binary expression: ${operator}`);
      }

      const left = this.visit(ctx.lhs[0]);
      return ts.factory.createBinaryExpression(
        left,
        ts.factory.createToken(token),
        right
      );
    } else if (ctx.lhs) {
      return this.visit(ctx.lhs[0]);
    } else {
      throw Error("Unknown expression type in " + Object.keys(ctx).join(","));
    }
  }

  binaryExpressionSuffix(ctx) {
    return {
      operator: ctx.binaryOperator[0].tokenType.name.toLowerCase(),
      right: this.visit(ctx.rhs[0]),
    };
  }

  unaryExpression(ctx) {
    const operator = ctx.operator[0].tokenType.name.toLowerCase();

    if (operator === "empty") {
      // isEmpty(<expression>)
      return ts.factory.createCallExpression(
        ts.factory.createIdentifier("isEmpty"),
        undefined,
        [this.visit(ctx.expression[0])]
      );

      /*
      // <expression>.length === 0
      return ts.factory.createBinaryExpression(
        ts.factory.createPropertyAccessExpression(
          this.visit(ctx.expression[0]),
          "length"
        ),
        ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
        ts.factory.createNumericLiteral("0")
      );
      */
    } else {
      let token;
      switch (operator) {
        case "not":
          token = ts.SyntaxKind.ExclamationToken;
          break;
        case "empty":
          token = ts.SyntaxKind.ExclamationToken;
          break;
        default:
          throw Error(`Unknown operator ${operator}`);
      }

      return ts.factory.createPrefixUnaryExpression(
        ts.SyntaxKind.ExclamationToken,
        this.visit(ctx.expression[0])
      );
    }
  }

  identifier(ctx) {
    return ts.factory.createIdentifier(ctx.Identifier[0].image);
  }

  booleanLiteral(ctx) {
    return ctx.BooleanLiteral[0].image === "true"
      ? ts.factory.createTrue()
      : ts.factory.createFalse();
  }

  integerLiteral(ctx) {
    return ts.factory.createNumericLiteral(ctx.IntegerLiteral[0].image);
  }

  stringLiteral(ctx) {
    const value = ctx.DoubleQuoteStringLiteral
      ? ctx.DoubleQuoteStringLiteral[0].image
      : ctx.SingleQuoteStringLiteral[0].image;
    return ts.factory.createStringLiteral(value.substring(1, value.length - 1));
  }
}

const toTypeScriptVisitorInstance = new ELToTypeScriptVisitor();

export function toTypeScript(inputText) {
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

  const ast = toTypeScriptVisitorInstance.visit(cst);

  return ast;
}
