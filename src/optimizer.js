// The optimizer module exports a single function, optimize(node), to perform
// machine-independent optimizations on the analyzed semantic representation.
//
// The only optimizations supported here are:
//
//   - assignments to self (x = x) turn into no-ops
//   - constant folding
//   - some strength reductions (+0, -0, *0, *1, etc.)
//   - Conditionals with constant tests collapse into a single arm

import { unary } from "./core.js"

export default function optimize(node) {
  return optimizers?.[node.kind]?.(node) ?? node
}

const optimizers = {
  Program(p) {
    p.statements = p.statements.flatMap(optimize)
    return p
  },
  VariableDeclaration(d) {
    d.initializer = optimize(d.initializer)
    return d
  },
  FunctionDeclaration(d) {
    d.fun = optimize(d.fun)
    return d
  },
  Function(f) {
    if (f.body) f.body = optimize(f.body)
    return f
  },
  Assignment(s) {
    s.source = optimize(s.source)
    if (s.source === s.target) {
      return []
    }
    return s
  },
  WhileStatement(s) {
    s.test = optimize(s.test)
    s.body = s.body.flatMap(optimize)
    return s
  },
  PrintStatement(s) {
    s.argument = optimize(s.argument)
    return s
  },
  Call(c) {
    c.args = c.args.map(optimize)
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
        } else if (e.op === "hypot") {
          return Math.hypot(e.left, e.right)
        }
      } else if (e.left === 0 && e.op === "+") {
        return e.right
      } else if (e.left === 1 && e.op === "*") {
        return e.right
      } else if (e.left === 0 && e.op === "-") {
        return unary("-", e.right)
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
      if (e.op === "-") return -e.operand
      if (e.op === "sqrt") return Math.sqrt(e.operand)
      if (e.op === "sin") return Math.sin(e.operand)
      if (e.op === "cos") return Math.cos(e.operand)
      if (e.op === "ln") return Math.log(e.operand)
      if (e.op === "exp") return Math.exp(e.operand)
    }
    return e
  },
}
