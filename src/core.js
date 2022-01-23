// Core classes and objects
//
// This module defines classes for the AST nodes. Only the constructors are
// defined here. Semantic analysis methods, optimization methods, and code
// generation are handled by other modules. This keeps the compiler organized
// by phase.

import util from "util"

export class Token {
  constructor(category, lexeme, position) {
    Object.assign(this, { category, lexeme, position })
  }
}

export class Program {
  constructor(statements) {
    this.statements = statements
  }
}

export class VariableDeclaration {
  constructor(id, initializer) {
    Object.assign(this, { id, initializer })
  }
}

export class FunctionDeclaration {
  constructor(id, params, body) {
    Object.assign(this, { id, params, body })
  }
}

export class Assignment {
  constructor(target, source) {
    Object.assign(this, { target, source })
  }
}

export class WhileStatement {
  constructor(test, body) {
    Object.assign(this, { test, body })
  }
}

export class PrintStatement {
  constructor(argument) {
    Object.assign(this, { argument })
  }
}

export class Call {
  constructor(callee, args) {
    Object.assign(this, { callee, args })
  }
}

export class Conditional {
  constructor(test, consequent, alternate) {
    Object.assign(this, { test, consequent, alternate })
  }
}

export class BinaryExpression {
  constructor(op, left, right) {
    Object.assign(this, { op, left, right })
  }
}

export class UnaryExpression {
  constructor(op, operand) {
    Object.assign(this, { op, operand })
  }
}

export class OrExpression {
  constructor(disjuncts) {
    Object.assign(this, { disjuncts })
  }
}

export class AndExpression {
  constructor(conjuncts) {
    Object.assign(this, { conjuncts })
  }
}

export class NotExpression {
  constructor(op, operand) {
    Object.assign(this, { op, operand })
  }
}

export class Variable {
  constructor(name, readOnly) {
    Object.assign(this, { name, readOnly })
  }
}

export class Function {
  constructor(name, paramCount) {
    Object.assign(this, { name, paramCount })
  }
}

export const standardLibrary = Object.freeze({
  π: new Variable("π", true),
  sqrt: new Function("sqrt", 1, true, true),
  sin: new Function("sin", 1, true, true),
  cos: new Function("cos", 1, true, true),
  random: new Function("random", 0, true, true),
  print: new Function("print", Infinity, true, false),
})

export function error(message, { line, column } = {}) {
  throw new Error(`Line ${line ?? "-"}, Column ${column ?? "-"}: ${message}`)
}

Program.prototype[util.inspect.custom] = function () {
  // Return a compact and pretty string representation of the node graph,
  // taking care of cycles. Written here from scratch because the built-in
  // inspect function, while nice, isn't nice enough. Defined properly in
  // the AST root class prototype so it automatically runs on console.log.
  const tags = new Map()

  function tag(node) {
    // Attach a unique integer tag to every AST node
    if (tags.has(node)) return
    if (typeof node !== "object" || node === null) return
    if (node.constructor === Token) return
    tags.set(node, tags.size + 1)
    for (const child of Object.values(node)) {
      Array.isArray(child) ? child.forEach(tag) : tag(child)
    }
  }

  function* lines() {
    function view(e) {
      if (tags.has(e)) return `#${tags.get(e)}`
      if (e && e.constructor === Token) {
        return e.category !== "#SYMBOL" ? e.lexeme : util.inspect(e.lexeme)
      }
      if (Array.isArray(e)) return `[${e.map(view)}]`
      return util.inspect(e)
    }
    for (let [node, id] of [...tags.entries()].sort((a, b) => a[1] - b[1])) {
      let [type, props] = [node.constructor.name, ""]
      Object.entries(node).forEach(([k, v]) => (props += ` ${k}=${view(v)}`))
      yield `${String(id).padStart(4, " ")} | ${type}${props}`
    }
  }

  tag(this)
  return [...lines()].join("\n")
}
