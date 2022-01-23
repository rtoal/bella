import fs from "fs"
import ohm from "ohm-js"
import * as core from "./core.js"

const bellaGrammar = ohm.grammar(fs.readFileSync("src/bella.ohm"))

const astBuilder = bellaGrammar.createSemantics().addOperation("ast", {
  Program(body) {
    return new core.Program(body.children.map(s => s.ast()))
  },
  Statement_vardec(_let, id, _eq, initializer, _semicolon) {
    return new core.VariableDeclaration(id.sourceString, initializer.ast())
  },
  Statement_fundec(_fun, id, _open, params, _close, _equals, body, _semicolon) {
    return new core.FunctionDeclaration(
      id.sourceString,
      params.asIteration().children.map(param => param.ast()),
      body.ast()
    )
  },
  Statement_assign(id, _eq, expression, _semicolon) {
    return new core.Assignment(id.sourceString, expression.ast())
  },
  Statement_call(call, _semicolon) {
    return call.ast()
  },
  Statement_while(_while, test, body) {
    return new core.WhileStatement(test.ast(), body.ast())
  },
  Block(_open, body, _close) {
    // No need for a block node, just return the list of statements
    return body.children.map(s => s.ast())
  },
  Exp_conditional(test, _questionMark, consequent, _colon, alternate) {
    return new core.Conditional(test.ast(), consequent.ast(), alternate.ast())
  },
  Exp1_or(left, _ops, right) {
    const operands = [left.ast(), ...right.children.map(e => e.ast())]
    return operands.reduce((x, y) => new core.BinaryExpression("||", x, y))
  },
  Exp1_and(left, _ops, right) {
    const operands = [left.ast(), ...right.children.map(e => e.ast())]
    return operands.reduce((x, y) => new core.BinaryExpression("&&", x, y))
  },
  Exp2_binary(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp3_binary(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp4_binary(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp5_binary(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },
  Exp6_unary(op, operand) {
    return new core.UnaryExpression(op.sourceString, operand.ast())
  },
  Exp7_parens(_open, expression, _close) {
    return expression.ast()
  },
  Call(callee, _left, args, _right) {
    return new core.Call(
      callee.ast(),
      args.asIteration().children.map(arg => arg.ast())
    )
  },
  id(_first, _rest) {
    return new core.Token("#ID", this.sourceString, this.source.startIdx)
  },
  true(_) {
    return new core.Token("#BOOL", this.sourceString, this.source.startIdx)
  },
  false(_) {
    return new core.Token("#BOOL", this.sourceString, this.source.startIdx)
  },
  num(_whole, _point, _fraction, _e, _sign, _exponent) {
    return new core.Token("#NUM", this.sourceString, this.source.startIdx)
  },
})

export default function parse(sourceCode) {
  const match = bellaGrammar.match(sourceCode)
  if (!match.succeeded()) {
    throw new Error(match.message)
  }
  return astBuilder(match).ast()
}
