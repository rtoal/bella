// ANALYZER
//
// The analyze() function takes the grammar match object (the CST) from Ohm
// and produces a decorated Abstract Syntax "Tree" (technically a graph) that
// includes all entities including those from the standard library.

import * as core from "./core.js"

// The single gate for error checking. Pass in a condition that must be true.
// Use errorLocation to give contextual information about the error that will
// appear: this should be an object whose "at" property is a parse tree node.
// Ohm's getLineAndColumnMessage will be used to prefix the error message.
function must(condition, message, errorLocation) {
  if (!condition) {
    const prefix = errorLocation.at.source.getLineAndColumnMessage()
    throw new Error(`${prefix}${message}`)
  }
}

function mustNotAlreadyBeDeclared(context, name, at) {
  must(!context.locals.has(name), `Identifier ${name} already declared`, at)
}

function mustHaveBeenFound(entity, name, at) {
  must(entity, `Identifier ${name} not declared`, at)
}

function mustNotBeReadOnly(entity, at) {
  must(!entity.readOnly, `${entity.name} is read only`, at)
}

function mustBeAVariable(entity, at) {
  must(entity instanceof core.Variable, `Functions can not appear here`, at)
}

function mustBeAFunction(entity, at) {
  must(entity instanceof core.Function, `${entity.name} is not a function`, at)
}

function mustHaveRightNumberOfArguments(argCount, paramCount, at) {
  const message = `${paramCount} argument(s) required but ${argCount} passed`
  must(argCount === paramCount, message, at)
}

class Context {
  constructor(parent) {
    this.parent = parent
    this.locals = new Map()
  }
  add(name, entity) {
    this.locals.set(name, entity)
  }
  lookup(name) {
    return this.locals.get(name) || this.parent?.lookup(name)
  }
}

export default function analyze(match) {
  let context = new Context()

  const analyzer = match.matcher.grammar.createSemantics().addOperation("rep", {
    Program(statements) {
      return new core.Program(statements.children.map(s => s.rep()))
    },

    Statement_vardec(_let, id, _eq, exp, _semicolon) {
      // Analyze the initializer *before* adding the variable to the context,
      // because we don't want the variable to come into scope until after
      // the declaration. That is, "let x=x;" should be an error (unless x
      // was already defined in an outer scope.)
      const initializer = exp.rep()
      const variable = new core.Variable(id.sourceString, false)
      mustNotAlreadyBeDeclared(context, id.sourceString, { at: id })
      context.add(id.sourceString, variable, id)
      return new core.VariableDeclaration(variable, initializer)
    },

    Statement_fundec(_fun, id, _open, ids, _close, _equals, exp, _semicolon) {
      ids = ids.asIteration().children
      const fun = new core.Function(id.sourceString, ids.length, true)
      // Add the function to the context before analyzing the body, because
      // we want to allow functions to be recursive
      mustNotAlreadyBeDeclared(context, id.sourceString, { at: id })
      context.add(id.sourceString, fun)
      // Analyze the parameters and the body inside a new context
      context = new Context(context)
      const params = ids.map(id => {
        const param = new core.Variable(id.sourceString, true)
        mustNotAlreadyBeDeclared(context, id.sourceString, { at: id })
        context.add(id.sourceString, param)
        return param
      })
      const body = exp.rep()
      // Restore previous context
      context = context.parent
      return new core.FunctionDeclaration(fun, params, body)
    },

    Statement_assign(id, _eq, exp, _semicolon) {
      const target = id.rep()
      mustNotBeReadOnly(target, { at: id })
      return new core.Assignment(target, exp.rep())
    },

    Statement_print(_print, exp, _semicolon) {
      return new core.PrintStatement(exp.rep())
    },

    Statement_while(_while, exp, block) {
      return new core.WhileStatement(exp.rep(), block.rep())
    },

    Block(_open, statements, _close) {
      return statements.children.map(s => s.rep())
    },

    Exp_unary(op, exp) {
      return new core.UnaryExpression(op.sourceString, exp.rep())
    },

    Exp_ternary(exp1, _questionMark, exp2, _colon, exp3) {
      return new core.Conditional(exp1.rep(), exp2.rep(), exp3.rep())
    },

    Exp1_binary(exp1, op, exp2) {
      return new core.BinaryExpression(op.sourceString, exp1.rep(), exp2.rep())
    },

    Exp2_binary(exp1, op, exp2) {
      return new core.BinaryExpression(op.sourceString, exp1.rep(), exp2.rep())
    },

    Exp3_binary(exp1, op, exp2) {
      return new core.BinaryExpression(op.sourceString, exp1.rep(), exp2.rep())
    },

    Exp4_binary(exp1, op, exp2) {
      return new core.BinaryExpression(op.sourceString, exp1.rep(), exp2.rep())
    },

    Exp5_binary(exp1, op, exp2) {
      return new core.BinaryExpression(op.sourceString, exp1.rep(), exp2.rep())
    },

    Exp6_binary(exp1, op, exp2) {
      return new core.BinaryExpression(op.sourceString, exp1.rep(), exp2.rep())
    },

    Exp7_parens(_open, exp, _close) {
      return exp.rep()
    },

    Call(id, _open, exps, _close) {
      const callee = context.lookup(id.sourceString, core.Function, id)
      mustHaveBeenFound(callee, id.sourceString, { at: id })
      mustBeAFunction(callee, { at: id })
      const args = exps.asIteration().children.map(arg => arg.rep())
      mustHaveRightNumberOfArguments(args.length, callee.paramCount, { at: id })
      return new core.Call(callee, args)
    },

    Exp7_id(id) {
      // ids used in expressions must have been already defined
      const entity = context.lookup(this.sourceString, core.Variable, this)
      mustHaveBeenFound(entity, id.sourceString, { at: id })
      mustBeAVariable(entity, { at: id })
      return entity
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
  })

  // Analysis starts here. First load up the initial context with entities
  // from the standard library. Then do the analysis using the semantics
  // object created above.
  for (const [name, type] of Object.entries(core.standardLibrary)) {
    context.add(name, type)
  }
  return analyzer(match).rep()
}
