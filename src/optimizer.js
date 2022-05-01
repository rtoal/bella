// Optimizer
//
// This module exports a single function to perform machine-independent
// optimizations on the analyzed semantic graph.
//
// The only optimizations supported here are:
//
//   - assignments to self (x = x) turn into no-ops
//   - constant folding
//   - some strength reductions (+0, -0, *0, *1, etc.)
//   - Conditionals with constant tests collapse into a single arm

import { UnaryExpression } from "./core.js"

export default function optimize(node) {
  return optimizers[node.constructor.name](node)
}

const optimizers = {
  Program(p) {
    p.statements = optimize(p.statements)
    return p
  },
  VariableDeclaration(d) {
    d.initializer = optimize(d.initializer)
    return d
  },
  Variable(v) {
    return v
  },
  FunctionDeclaration(d) {
    d.params = optimize(d.params)
    d.body = optimize(d.body)
    return d
  },
  Function(f) {
    return f
  },
  Assignment(s) {
    s.source = optimize(s.source)
    if (s.source === s.target) {
      return null
    }
    return s
  },
  WhileStatement(s) {
    s.test = optimize(s.test)
    s.body = optimize(s.body)
    return s
  },
  PrintStatement(s) {
    s.argument = optimize(s.argument)
    return s
  },
  Call(c) {
    c.callee = optimize(c.callee)
    c.args = optimize(c.args)
    if (c.args.length === 1 && c.args[0].constructor === Number) {
      if (c.callee.name === "sqrt") return Math.sqrt(c.args[0])
      if (c.callee.name === "sin") return Math.sin(c.args[0])
      if (c.callee.name === "cos") return Math.cos(c.args[0])
      if (c.callee.name === "ln") return Math.log(c.args[0])
      if (c.callee.name === "exp") return Math.exp(c.args[0])
    }
    return c
  },
  Conditional(c) {
    c.test = optimize(c.test)
    c.consequent = optimize(c.consequent)
    c.alternate = optimize(c.alternate)
    if (c.test.constructor === Number || c.test.constructor === Boolean) {
      return c.test ? c.consequent : c.alternate
    }
    return c
  },
  BinaryExpression(e) {
    e.left = optimize(e.left)
    e.right = optimize(e.right)
    if (e.left.constructor === Number) {
      if (e.right.constructor === Number) {
        if (e.op === "+") {
          return e.left + e.right
        } else if (e.op === "-") {
          return e.left - e.right
        } else if (e.op === "*") {
          return e.left * e.right
        } else if (e.op === "/") {
          return e.left / e.right
        } else if (e.op === "%") {
          return e.left % e.right
        } else if (e.op === "**" && !(e.left === 0 && e.right == 0)) {
          return e.left ** e.right
        }
      } else if (e.left === 0 && e.op === "+") {
        return e.right
      } else if (e.left === 1 && e.op === "*") {
        return e.right
      } else if (e.left === 0 && e.op === "-") {
        return new UnaryExpression("-", e.right)
      } else if (e.left === 0 && ["*", "/", "%"].includes(e.op)) {
        return 0
      } else if (e.op === "**" && e.left === 1) {
        return 1
      }
    } else if (e.right.constructor === Number) {
      if (["+", "-"].includes(e.op) && e.right === 0) {
        return e.left
      } else if (["*", "/"].includes(e.op) && e.right === 1) {
        return e.left
      } else if (e.op === "*" && e.right === 0) {
        return 0
      } else if (e.op === "**" && e.left !== 0 && e.right === 0) {
        return 1
      }
    }
    return e
  },
  UnaryExpression(e) {
    e.operand = optimize(e.operand)
    if (e.operand.constructor === Number) {
      if (e.op === "-") {
        return -e.operand
      }
    }
    return e
  },
  Number(n) {
    return n
  },
  Boolean(b) {
    return b
  },
  Array(a) {
    // Optimizing arrays involves flattening an removing nulls
    return a.flatMap(optimize).filter(s => s !== null)
  },
}
