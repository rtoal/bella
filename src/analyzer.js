// Semantic analysis is done with the help of a context object, which roughly
// corresponds to lexical scopes in Bella. As Bella features static, nested
// scopes, each context contains not only a mapping of locally declared
// identifiers to their entities, but also a pointer to the static parent
// context. The root context, which contains the pre-declared identifiers and
// any globals, has a parent of null.

import fs from "fs"
import ohm from "ohm-js"
import * as core from "./core.js"

const error = core.error
const bellaGrammar = ohm.grammar(fs.readFileSync("src/bella.ohm"))

class Context {
  constructor(parent = null) {
    this.parent = parent
    this.locals = new Map()
  }
  add(name, entity) {
    if (this.locals.has(name)) {
      error(`The identifier ${name} has already been declared`)
    }
    this.locals.set(name, entity)
    return entity
  }
  get(token, expectedType) {
    let entity
    for (let context = this; context; context = context.parent) {
      entity = context.locals.get(token.lexeme)
      if (entity) break
    }
    if (!entity) error(`Identifier ${token.lexeme} not declared`, token)
    if (entity.constructor !== expectedType) {
      error(`${token.lexeme} was expected to be a ${expectedType.name}`, token)
    }
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
      const variable = id.rep()
      variable.value = new core.Variable(variable.lexeme, false)
      context.add(variable.lexeme, variable.value)
      return new core.VariableDeclaration(variable, initializerRep)
    },
    Statement_fundec(_fun, id, _open, params, _close, _equals, body, _semicolon) {
      const fun = id.rep()
      const paramsRep = params.asIteration().rep()

      // Add the function to the context before analyzing the body, because
      // we want to allow functions to be recursive
      fun.value = new core.Function(fun.lexeme, paramsRep.length, true)
      context.add(fun.lexeme, fun.value)
      context = new Context(context)
      for (const p of paramsRep) {
        let variable = new core.Variable(p.lexeme, true)
        context.add(p.lexeme, variable)
        p.value = variable
      }
      const bodyRep = body.rep()
      context = context.parent
      return new core.FunctionDeclaration(fun, paramsRep, bodyRep)
    },
    Statement_assign(id, _eq, expression, _semicolon) {
      const target = id.rep()
      if (target.value.readOnly) {
        error(`The identifier ${target.lexeme} is read only`, target)
      }
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
      const idRep = id.rep()
      idRep.value = context.get(idRep, core.Variable)
      return idRep
    },
    Call(callee, _left, args, _right) {
      const calleeRep = callee.rep()
      const argsRep = args.asIteration().rep()
      calleeRep.value = context.get(calleeRep, core.Function)
      const expectedParamCount = calleeRep.value.paramCount
      if (argsRep.length !== expectedParamCount) {
        error(`Expected ${expectedParamCount} arg(s), found ${argsRep.length}`, calleeRep)
      }
      return new core.Call(calleeRep, argsRep)
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
    context.add(name, entity)
  }
  const match = bellaGrammar.match(sourceCode)
  if (!match.succeeded()) core.error(match.message)
  return analyzer(match).rep()
}
