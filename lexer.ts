import { createToken, Lexer } from "chevrotain";

export const Whitespace = createToken({
  name: "Whitespace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

// "KeywordOrIdentifier" is our Token category used to match any keyword or Identifier
export const KeywordOrIdentifier = createToken({
  name: "KeywordOrIdentifier",
  pattern: Lexer.NA,
});

// General Identifier
export const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z]\w*/,
  categories: [KeywordOrIdentifier],
});

export const BooleanLiteral = createToken({
  name: "BooleanLiteral",
  pattern: /true|false/,
  longer_alt: Identifier,
  categories: [KeywordOrIdentifier],
});

export const DoubleQuoteStringLiteral = createToken({
  name: "DoubleQuoteStringLiteral",
  pattern: /\"(\\.|[^\"])*\"/,
});

export const SingleQuoteStringLiteral = createToken({
  name: "SingleQuoteStringLiteral",
  pattern: /\'(\\.|[^\'])*\'/,
});

export const IntegerLiteral = createToken({
  name: "IntegerLiteral",
  pattern: /\d+/,
});

export const LiteralExpression = createToken({
  name: "LiteralExpression",
  pattern: /[^#${}]+/,
  line_breaks: true,
});

export const StartDeferredExpression = createToken({
  name: "StartDeferredExpression",
  pattern: /#{/,
  label: "#{",
  push_mode: "deferredExpressionMode",
});

export const RCurl = createToken({
  name: "RCurl",
  pattern: /}/,
  label: "}",
  pop_mode: true,
});

export const StartDynamicExpression = createToken({
  name: "StartDynamicExpression",
  pattern: /\${/,
  label: "${",
  push_mode: "dynamicExpressionMode",
});

export const Colon = createToken({
  name: "Colon",
  pattern: /:/,
});

export const Dot = createToken({
  name: "Dot",
  pattern: /\./,
});

export const QuestionMark = createToken({
  name: "QuestionMark",
  pattern: /\?/,
});

export const Minus = createToken({
  name: "Minus",
  pattern: /-/,
});

export const Not = createToken({
  name: "Not",
  pattern: /!|not/,
});

export const Empty = createToken({
  name: "Empty",
  pattern: /empty/,
  longer_alt: Identifier,
  categories: [KeywordOrIdentifier],
});

export const Or = createToken({
  name: "Or",
  pattern: /or|\|\|/,
});

export const And = createToken({
  name: "And",
  pattern: /and|&&/,
});

export const Eq = createToken({
  name: "Eq",
  pattern: /==|eq/,
});

export const NotEq = createToken({
  name: "NotEq",
  pattern: /!=|ne/,
});

export const Gt = createToken({
  name: "Gt",
  pattern: />|gt/,
});

export const Lt = createToken({
  name: "Lt",
  pattern: /<|lt/,
});

/*
<DEFAULT> TOKEN :
{
  < LITERAL_EXPRESSION:
    ((~["\\", "$", "#"])
      | ("\\" ("\\" | "$" | "#"))
      | ("$" ~["{", "$", "#"])
      | ("#" ~["{", "$", "#"])
    )+
    | "$"
    | "#"
  >
|
  < START_DYNAMIC_EXPRESSION: "${" > {stack.push(DEFAULT);}: IN_EXPRESSION
|
  < START_DEFERRED_EXPRESSION: "#{" > {stack.push(DEFAULT);}: IN_EXPRESSION
}
*/

export const tokens = [
  Whitespace,
  BooleanLiteral,
  DoubleQuoteStringLiteral,
  SingleQuoteStringLiteral,
  IntegerLiteral,
  RCurl,
  Colon,
  Dot,
  Minus,
  Not,
  Empty,
  QuestionMark,
  Or,
  And,
  Eq,
  NotEq,
  Gt,
  Lt,
  Identifier,
];

export const allTokens = {
  modes: {
    dynamicExpressionMode: tokens,
    deferredExpressionMode: tokens,
    outerMode: [
      StartDeferredExpression,
      StartDynamicExpression,
      LiteralExpression,
    ],
  },
  defaultMode: "outerMode",
};

export const elLexer = new Lexer(allTokens);

export function lex(inputText: string) {
  const lexingResult = elLexer.tokenize(inputText);

  if (lexingResult.errors.length > 0) {
    console.error(lexingResult.errors);
    throw Error("Sad Sad Panda, lexing errors detected");
  }

  return lexingResult;
}
