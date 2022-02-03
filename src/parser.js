import fs from "fs"
import ohm from "ohm-js"
import * as core from "./core.js"

const bellaGrammar = ohm.grammar(fs.readFileSync("src/bella.ohm"))

const astBuilder = bellaGrammar.createSemantics().addOperation("ast", {
  Program(body) {
    return new core.Program(body.ast())
  },
  Statement_vardec(_let, id, _eq, initializer, _semicolon) {
    return new core.VariableDeclaration(id.ast(), initializer.ast())
  },
  Statement_fundec(_fun, id, _open, params, _close, _equals, body, _semicolon) {
    return new core.FunctionDeclaration(id.ast(), params.asIteration().ast(), body.ast())
  },
  Statement_assign(id, _eq, expression, _semicolon) {
    return new core.Assignment(id.ast(), expression.ast())
  },
  Statement_print(_print, argument, _semicolon) {
    return new core.PrintStatement(argument.ast())
  },
  Statement_while(_while, test, body) {
    return new core.WhileStatement(test.ast(), body.ast())
  },
  Block(_open, body, _close) {
    return body.ast()
  },
  Exp_negation(op, operand) {
    return new core.NegationExpression(op.sourceString, operand.ast())
  },
  Exp_conditional(test, _questionMark, consequent, _colon, alternate) {
    return new core.Conditional(test.ast(), consequent.ast(), alternate.ast())
  },
  Arm_binary(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Term_binary(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Factor_binary(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Primary_parens(_open, expression, _close) {
    return expression.ast()
  },
  Test_not(op, operand) {
    return new core.NotExpression(op.sourceString, operand.ast())
  },
  Test_or(left, _ops, right) {
    return new core.OrExpression([left.ast(), ...right.ast()])
  },
  Test_and(left, _ops, right) {
    return new core.AndExpression([left.ast(), ...right.ast()])
  },
  Condition_relation(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  TruthVal_parens(_open, condition, _close) {
    return condition.ast()
  },
  Call(callee, _left, args, _right) {
    return new core.Call(callee.ast(), args.asIteration().ast())
  },
  id(_first, _rest) {
    return new core.Token("Id", this.sourceString, this.source.startIdx)
  },
  true(_) {
    return new core.Token("Bool", this.sourceString, this.source.startIdx)
  },
  false(_) {
    return new core.Token("Bool", this.sourceString, this.source.startIdx)
  },
  num(_whole, _point, _fraction, _e, _sign, _exponent) {
    return new core.Token("Num", this.sourceString, this.source.startIdx)
  },
  _iter(...children) {
    return children.map(child => child.ast())
  },
})

export default function parse(sourceCode) {
  const match = bellaGrammar.match(sourceCode)
  if (!match.succeeded()) core.error(match.message)
  return astBuilder(match).ast()
}
