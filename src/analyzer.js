// Semantic analysis is done with the help of a context object, which roughly
// corresponds to lexical scopes in Bella. As Bella features static, nested
// scopes, each context contains not only a mapping of locally declared
// identifiers to their entities, but also a pointer to the static parent
// context. The root context, which contains the pre-declared identifiers and
// any globals, has a parent of null.

import fs from "fs"
import * as ohm from "ohm-js"
import * as core from "./core.js"

const bellaGrammar = ohm.grammar(fs.readFileSync("src/bella.ohm"))

// Throw an error message that takes advantage of Ohm's messaging
function error(message, node) {
  if (node) {
    throw new Error(`${node.source.getLineAndColumnMessage()}${message}`)
  }
  throw new Error(message)
}

function check(condition, message, node) {
  if (!condition) error(message, node)
}

class Context {
  constructor(parent = null) {
    this.parent = parent
    this.locals = new Map()
  }
  add(name, entity, node) {
    check(!this.locals.has(name), `${name} has already been declared`, node)
    this.locals.set(name, entity)
    return entity
  }
  get(name, expectedType, node) {
    let entity
    for (let context = this; context; context = context.parent) {
      entity = context.locals.get(name)
      if (entity) break
    }
    check(entity, `${name} has not been declared`, node)
    check(
      entity.constructor === expectedType,
      `${name} was expected to be a ${expectedType.name}`,
      node
    )
    return entity
  }
}

export default function analyze(sourceCode) {
  let context = new Context()

  const analyzer = bellaGrammar.createSemantics().addOperation("rep", {
    Program(statements) {
      return new core.Program(statements.rep())
    },
    Statement_vardec(_let, id, _eq, exp, _semicolon) {
      // Analyze the initializer *before* adding the variable to the context,
      // because we don't want the variable to come into scope until after
      // the declaration. That is, "let x=x;" should be an error (unless x
      // was already defined in an outer scope.)
      const initializer = exp.rep()
      const variable = new core.Variable(id.sourceString, false)
      context.add(id.sourceString, variable, id)
      return new core.VariableDeclaration(variable, initializer)
    },
    Statement_fundec(_fun, id, _open, ids, _close, _equals, exp, _semicolon) {
      ids = ids.asIteration().children
      const fun = new core.Function(id.sourceString, ids.length, true)
      // Add the function to the context before analyzing the body, because
      // we want to allow functions to be recursive
      context.add(id.sourceString, fun, id)
      // Analyze the parameters and the body inside a new context
      context = new Context(context)
      const params = ids.map(id => {
        const param = new core.Variable(id.sourceString, true)
        context.add(id.sourceString, param)
        return param
      })
      const body = exp.rep()
      // Restore previous context
      context = context.parent
      return new core.FunctionDeclaration(fun, params, body)
    },
    Statement_assign(id, _eq, expression, _semicolon) {
      const target = id.rep()
      check(!target.readOnly, `${target.name} is read only`, id)
      return new core.Assignment(target, expression.rep())
    },
    Statement_print(_print, expression, _semicolon) {
      return new core.PrintStatement(expression.rep())
    },
    Statement_while(_while, expression, block) {
      return new core.WhileStatement(expression.rep(), block.rep())
    },
    Block(_open, statements, _close) {
      return statements.rep()
    },
    Exp_unary(op, operand) {
      return new core.UnaryExpression(op.rep(), operand.rep())
    },
    Exp_ternary(test, _questionMark, consequent, _colon, alternate) {
      return new core.Conditional(test.rep(), consequent.rep(), alternate.rep())
    },
    Exp1_binary(left, op, right) {
      return new core.BinaryExpression(op.rep(), left.rep(), right.rep())
    },
    Exp2_binary(left, op, right) {
      return new core.BinaryExpression(op.rep(), left.rep(), right.rep())
    },
    Exp3_binary(left, op, right) {
      return new core.BinaryExpression(op.rep(), left.rep(), right.rep())
    },
    Exp4_binary(left, op, right) {
      return new core.BinaryExpression(op.rep(), left.rep(), right.rep())
    },
    Exp5_binary(left, op, right) {
      return new core.BinaryExpression(op.rep(), left.rep(), right.rep())
    },
    Exp6_binary(left, op, right) {
      return new core.BinaryExpression(op.rep(), left.rep(), right.rep())
    },
    Exp7_parens(_open, expression, _close) {
      return expression.rep()
    },
    Call(id, open, exps, _close) {
      const callee = context.get(id.sourceString, core.Function, id)
      const args = exps.asIteration().rep()
      check(
        args.length === callee.paramCount,
        `Expected ${callee.paramCount} arg(s), found ${args.length}`,
        open
      )
      return new core.Call(callee, args)
    },
    id(_first, _rest) {
      // Designed to get here only for ids in expressions
      return context.get(this.sourceString, core.Variable, this)
    },
    true(_) {
      return true
    },
    false(_) {
      return false
    },
    num(_whole, _point, _fraction, _e, _sign, _exponent) {
      return Number(this.sourceString)
    },
    _terminal() {
      return this.sourceString
    },
    _iter(...children) {
      return children.map(child => child.rep())
    },
  })

  for (const [name, entity] of Object.entries(core.standardLibrary)) {
    context.locals.set(name, entity)
  }
  const match = bellaGrammar.match(sourceCode)
  if (!match.succeeded()) error(match.message)
  return analyzer(match).rep()
}
