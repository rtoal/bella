// Semantic analysis is done with the help of a context object, which roughly
// corresponds to lexical scopes in Bella. As Bella features static, nested
// scopes, each context contains not only a mapping of locally declared
// identifiers to their entities, but also a pointer to the static parent
// context. The root context, which contains the pre-declared identifiers and
// any globals, has a parent of null.

import fs from "fs"
import ohm from "ohm-js"
import * as core from "./core.js"

const bellaGrammar = ohm.grammar(fs.readFileSync("src/bella.ohm"))

function check(condition, message, token) {
  if (!condition) core.error(message, token)
}

class Context {
  constructor(parent = null) {
    this.parent = parent
    this.locals = new Map()
  }
  add(token, entity) {
    check(
      !this.locals.has(token.lexeme),
      `${token.lexeme} has already been declared`,
      token
    )
    this.locals.set(token.lexeme, entity)
    return entity
  }
  get(token, expectedType) {
    let entity
    for (let context = this; context; context = context.parent) {
      entity = context.locals.get(token.lexeme)
      if (entity) break
    }
    check(entity, `${token.lexeme} has not been declared`, token)
    check(
      entity.constructor === expectedType,
      `${token.lexeme} was expected to be a ${expectedType.name}`,
      token
    )
    return entity
  }
}

export default function analyze(sourceCode) {
  let context = new Context()

  const analyzer = bellaGrammar.createSemantics().addOperation("rep", {
    Program(body) {
      return new core.Program(body.rep())
    },
    Statement_vardec(_let, id, _eq, initializer, _semicolon) {
      // Analyze the initializer *before* adding the variable to the context,
      // because we don't want the variable to come into scope until after
      // the declaration. That is, "let x=x;" should be an error (unless x
      // was already defined in an outer scope.)
      const initializerRep = initializer.rep()
      const idRep = id.rep()
      const variable = new core.Variable(idRep.lexeme, false)
      context.add(idRep, variable)
      return new core.VariableDeclaration(variable, initializerRep)
    },
    Statement_fundec(_fun, id, _open, params, _close, _equals, body, _semicolon) {
      const idRep = id.rep()
      let paramsRep = params.asIteration().rep()
      const fun = new core.Function(idRep.lexeme, paramsRep.length, true)
      // Add the function to the context before analyzing the body, because
      // we want to allow functions to be recursive
      context.add(idRep, fun)
      context = new Context(context)
      paramsRep = paramsRep.map(p => {
        let variable = new core.Variable(p.lexeme, true)
        context.add(p, variable)
        return variable
      })
      const bodyRep = body.rep()
      context = context.parent
      return new core.FunctionDeclaration(fun, paramsRep, bodyRep)
    },
    Statement_assign(id, _eq, expression, _semicolon) {
      const target = id.rep()
      check(!target.readOnly, `${target.name} is read only`, id)
      return new core.Assignment(target, expression.rep())
    },
    Statement_print(_print, argument, _semicolon) {
      return new core.PrintStatement(argument.rep())
    },
    Statement_while(_while, test, body) {
      return new core.WhileStatement(test.rep(), body.rep())
    },
    Block(_open, body, _close) {
      return body.rep()
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
    Exp7_id(id) {
      return context.get(id.rep(), core.Variable)
    },
    Call(callee, left, args, _right) {
      const fun = context.get(callee.rep(), core.Function)
      const argsRep = args.asIteration().rep()
      check(
        argsRep.length === fun.paramCount,
        `Expected ${fun.paramCount} arg(s), found ${argsRep.length}`,
        left
      )
      return new core.Call(fun, argsRep)
    },
    id(_first, _rest) {
      return new core.Token("Id", this.source)
    },
    true(_) {
      return new core.Token("Bool", this.source, true)
    },
    false(_) {
      return new core.Token("Bool", this.source, false)
    },
    num(_whole, _point, _fraction, _e, _sign, _exponent) {
      return new core.Token("Num", this.source, Number(this.source.contents))
    },
    _terminal() {
      return new core.Token("Sym", this.source)
    },
    _iter(...children) {
      return children.map(child => child.rep())
    },
  })

  for (const [name, entity] of Object.entries(core.standardLibrary)) {
    context.locals.set(name, entity)
  }
  const match = bellaGrammar.match(sourceCode)
  if (!match.succeeded()) core.error(match.message)
  return analyzer(match).rep()
}
