import { CstParser } from "chevrotain";

import {
  Identifier,
  KeywordOrIdentifier,
  StartDeferredExpression,
  StartDynamicExpression,
  LiteralExpression,
  RCurl,
  allTokens,
  elLexer,
  BooleanLiteral,
  IntegerLiteral,
  DoubleQuoteStringLiteral,
  SingleQuoteStringLiteral,
  QuestionMark,
  Colon,
  Dot,
  Minus,
  Not,
  Empty,
  And,
  Or,
  Eq,
  NotEq,
  Gt,
  Lt,
} from "./lexer";

export class ELParser extends CstParser {
  constructor() {
    super(allTokens, {
      recoveryEnabled: true,
    });

    this.performSelfAnalysis();
  }

  public compositeExpression = this.RULE("compositeExpression", () => {
    this.MANY(() => this.SUBRULE(this.compositeExpressionItem, {}));
  });

  private compositeExpressionItem = this.RULE("compositeExpressionItem", () =>
    this.OR([
      { ALT: () => this.SUBRULE(this.deferredExpression) },
      { ALT: () => this.SUBRULE(this.dynamicExpression) },
      { ALT: () => this.SUBRULE(this.literalExpression) },
    ])
  );

  private deferredExpression = this.RULE("deferredExpression", () => {
    this.CONSUME(StartDeferredExpression);
    this.SUBRULE(this.expression);
    this.CONSUME(RCurl);
  });

  private dynamicExpression = this.RULE("dynamicExpression", () => {
    this.CONSUME(StartDynamicExpression);
    this.SUBRULE(this.expression);
    this.CONSUME(RCurl);
  });

  private literalExpression = this.RULE("literalExpression", () => {
    this.CONSUME(LiteralExpression);
  });

  private expression = this.RULE("expression", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.value, { LABEL: "lhs" }) },
      { ALT: () => this.SUBRULE(this.unaryExpression, { LABEL: "lhs" }) },
    ]);
    this.OPTION(() => {
      this.SUBRULE(this.binaryExpressionSuffix);
    });
    this.OPTION2(() => {
      this.CONSUME(QuestionMark, {
        LABEL: "ternary",
      });
      this.SUBRULE2(this.expression, {
        LABEL: "consequent",
      });
      this.CONSUME(Colon);
      this.SUBRULE3(this.expression, {
        LABEL: "alternate",
      });
    });
  });

  private binaryExpressionSuffix = this.RULE("binaryExpressionSuffix", () => {
    const opts = { LABEL: "binaryOperator" };
    this.OR([
      { ALT: () => this.CONSUME(And, opts) },
      { ALT: () => this.CONSUME(Or, opts) },
      { ALT: () => this.CONSUME(Eq, opts) },
      { ALT: () => this.CONSUME(NotEq, opts) },
      { ALT: () => this.CONSUME(Gt, opts) },
      { ALT: () => this.CONSUME(Lt, opts) },
    ]);
    this.SUBRULE(this.expression, { LABEL: "rhs" });
  });

  private unaryExpression = this.RULE("unaryExpression", () => {
    this.OR([
      {
        ALT: () => this.CONSUME(Minus, { LABEL: "operator" }),
      },
      {
        ALT: () => this.CONSUME(Not, { LABEL: "operator" }),
      },
      {
        ALT: () => this.CONSUME(Empty, { LABEL: "operator" }),
      },
    ]);
    this.SUBRULE(this.expression);
  });

  private identifier = this.RULE("identifier", () => {
    this.CONSUME(Identifier);
  });

  private valuePrefix = this.RULE("valuePrefix", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.booleanLiteral) },
      { ALT: () => this.SUBRULE(this.integerLiteral) },
      { ALT: () => this.SUBRULE(this.stringLiteral) },
      { ALT: () => this.SUBRULE(this.identifier) },
    ]);
  });

  private valueSuffix = this.RULE("valueSuffix", () => {
    this.CONSUME(Dot);
    this.SUBRULE(this.identifier);
  });

  private value = this.RULE("value", () => {
    this.SUBRULE(this.valuePrefix);
    this.MANY(() => {
      this.SUBRULE(this.valueSuffix);
    });
  });

  private booleanLiteral = this.RULE("booleanLiteral", () => {
    this.CONSUME(BooleanLiteral);
  });

  private integerLiteral = this.RULE("integerLiteral", () => {
    this.CONSUME(IntegerLiteral);
  });

  private stringLiteral = this.RULE("stringLiteral", () => {
    this.OR([
      { ALT: () => this.CONSUME(DoubleQuoteStringLiteral) },
      { ALT: () => this.CONSUME(SingleQuoteStringLiteral) },
    ]);
  });
}

// We only ever need one as the parser internal state is reset for each new input.
const parserInstance = new ELParser();

export function parse(inputText: string) {
  const lexResult = elLexer.tokenize(inputText);

  // ".input" is a setter which will reset the parser's internal state.
  parserInstance.input = lexResult.tokens;

  // No semantic actions so this won't return anything yet.
  parserInstance.compositeExpression();

  if (parserInstance.errors.length > 0) {
    throw Error(
      "Sad sad panda, parsing errors detected!\n" +
        parserInstance.errors[0].message
    );
  }
}
