// The semantic analyzer exports a single function, analyze(match), that
// accepts a grammar match object (the CST) from Ohm and produces the
// internal representation of the program (pretty close to what is usually
// called the AST). This representation also includes entities from the
// standard library, as needed.

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
  checkNotDeclared(name, at) {
    must(!this.locals.has(name), `Identifier ${name} already declared`, at)
  }
  checkIsFound(entity, name, at) {
    must(entity, `Identifier ${name} not declared`, at)
  }
  checkIsVariable(entity, at) {
    // Bella has two kinds of entities: variables and functions.
    must(entity?.kind === "Variable", `Functions can not appear here`, at)
  }
  checkIsFunction(entity, at) {
    must(entity?.kind === "Function", `${entity.name} is not a function`, at)
  }
  checkNotReadOnly(entity, at) {
    must(!entity.readOnly, `${entity.name} is read only`, at)
  }
  checkArgumentCount(argCount, paramCount, at) {
    const equalCount = argCount === paramCount
    must(equalCount, `${paramCount} argument(s) required but ${argCount} passed`, at)
  }
}

export default function analyze(match) {
  let context = new Context()

  const analyzer = match.matcher.grammar.createSemantics().addOperation("rep", {
    Program(statements) {
      return core.program(statements.children.map(s => s.rep()))
    },

    Statement_vardec(_let, id, _eq, exp, _semicolon) {
      // Analyze the initializer *before* adding the variable to the context,
      // because we don't want the variable to come into scope until after
      // the declaration. That is, "let x=x;" should be an error (unless x
      // was already defined in an outer scope.)
      const initializer = exp.rep()
      const variable = core.variable(id.sourceString, false)
      context.checkNotDeclared(id.sourceString, { at: id })
      context.add(id.sourceString, variable)
      return core.variableDeclaration(variable, initializer)
    },

    Statement_fundec(_fun, id, parameters, _equals, exp, _semicolon) {
      // Start by adding a new function object to this context. We won't
      // have the number of params yet; that will come later. But we have
      // to get the function in the context right way, to allow recursion.
      const fun = core.fun(id.sourceString)
      context.checkNotDeclared(id.sourceString, { at: id })
      context.add(id.sourceString, fun)

      // Add the params and body to the child context, updating the
      // function object with the parameter count once we have it.
      context = new Context(context)
      const params = parameters.rep()
      fun.paramCount = params.length
      const body = exp.rep()
      context = context.parent

      // Now that the function object is created, we can make the declaration.
      return core.functionDeclaration(fun, params, body)
    },

    Params(_open, idList, _close) {
      return idList.asIteration().children.map(id => {
        const param = core.variable(id.sourceString, true)
        // All of the parameters have to be unique
        context.checkNotDeclared(id.sourceString, { at: id })
        context.add(id.sourceString, param)
        return param
      })
    },

    Statement_assign(id, _eq, exp, _semicolon) {
      const target = id.rep()
      context.checkNotReadOnly(target, { at: id })
      return core.assignment(target, exp.rep())
    },

    Statement_print(_print, exp, _semicolon) {
      return core.printStatement(exp.rep())
    },

    Statement_while(_while, exp, block) {
      return core.whileStatement(exp.rep(), block.rep())
    },

    Block(_open, statements, _close) {
      return statements.children.map(s => s.rep())
    },

    Exp_unary(op, exp) {
      return core.unary(op.sourceString, exp.rep())
    },

    Exp_ternary(exp1, _questionMark, exp2, _colon, exp3) {
      return core.conditional(exp1.rep(), exp2.rep(), exp3.rep())
    },

    Exp1_binary(exp1, op, exp2) {
      return core.binary(op.sourceString, exp1.rep(), exp2.rep())
    },

    Exp2_binary(exp1, op, exp2) {
      return core.binary(op.sourceString, exp1.rep(), exp2.rep())
    },

    Exp3_binary(exp1, op, exp2) {
      return core.binary(op.sourceString, exp1.rep(), exp2.rep())
    },

    Exp4_binary(exp1, op, exp2) {
      return core.binary(op.sourceString, exp1.rep(), exp2.rep())
    },

    Exp5_binary(exp1, op, exp2) {
      return core.binary(op.sourceString, exp1.rep(), exp2.rep())
    },

    Exp6_binary(exp1, op, exp2) {
      return core.binary(op.sourceString, exp1.rep(), exp2.rep())
    },

    Exp7_parens(_open, exp, _close) {
      return exp.rep()
    },

    Call(id, _open, expList, _close) {
      // ids used in calls must have already been declared and must be
      // bound to function entities, not to variable entities.
      const callee = context.lookup(id.sourceString)
      context.checkIsFound(callee, id.sourceString, { at: id })
      context.checkIsFunction(callee, { at: id })
      const args = expList.asIteration().children.map(arg => arg.rep())
      context.checkArgumentCount(args.length, callee.paramCount, { at: id })
      return core.call(callee, args)
    },

    Exp7_id(id) {
      // ids used in expressions must have been already declared and must
      // be bound to variable entities, not function entities.
      const entity = context.lookup(id.sourceString)
      context.checkIsFound(entity, id.sourceString, { at: id })
      context.checkIsVariable(entity, { at: id })
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
