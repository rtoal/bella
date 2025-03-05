// The code generator exports a single function, generate(program), which
// accepts a program representation and returns the JavaScript translation
// as a string.

import { standardLibrary } from "./core.js"

export default function generate(program) {
  // When generating code for statements, we'll accumulate the lines of
  // the target code here. When we finish generating, we'll join the lines
  // with newlines and return the result.
  const output = []

  // Variable names in JS will be suffixed with _1, _2, _3, etc. This is
  // because "for", for example, is a legal variable name in Bella, but
  // not in JS. So we want to generate something like "for_1". We handle
  // this by mapping each variable declaration to its suffix.
  const targetName = (mapping => {
    return entity => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size + 1)
      }
      return `${entity.name}_${mapping.get(entity)}`
    }
  })(new Map())

  const gen = node => generators?.[node?.kind]?.(node) ?? node

  const generators = {
    // Key idea: when generating an expression, just return the JS string; when
    // generating a statement, write lines of translated JS to the output array.
    Program(p) {
      p.statements.forEach(gen)
    },
    VariableDeclaration(d) {
      output.push(`let ${targetName(d.variable)} = ${gen(d.initializer)};`)
    },
    Variable(v) {
      if (v === standardLibrary.π) return "Math.PI"
      return targetName(v)
    },
    FunctionDeclaration(d) {
      const params = d.fun.params.map(targetName).join(", ")
      output.push(`function ${targetName(d.fun)}(${params}) {`)
      output.push(`return ${gen(d.fun.body)};`)
      output.push("}")
    },
    Function(f) {
      return targetName(f)
    },
    PrintStatement(s) {
      output.push(`console.log(${gen(s.argument)});`)
    },
    Assignment(s) {
      output.push(`${targetName(s.target)} = ${gen(s.source)};`)
    },
    WhileStatement(s) {
      output.push(`while (${gen(s.test)}) {`)
      s.body.forEach(gen)
      output.push("}")
    },
    Call(c) {
      return `${gen(c.callee)}(${c.args.map(gen).join(",")})`
    },
    Conditional(e) {
      return `((${gen(e.test)}) ? (${gen(e.consequent)}) : (${gen(e.alternate)}))`
    },
    BinaryExpression(e) {
      if (e.op === "hypot") return `Math.hypot(${gen(e.left)},${gen(e.right)})`
      return `(${gen(e.left)} ${e.op} ${gen(e.right)})`
    },
    UnaryExpression(e) {
      const operand = gen(e.operand)
      if (e.op === "sqrt") return `Math.sqrt(${operand})`
      if (e.op === "sin") return `Math.sin(${operand})`
      if (e.op === "cos") return `Math.cos(${operand})`
      if (e.op === "exp") return `Math.exp(${operand})`
      if (e.op === "ln") return `Math.log(${operand})`
      return `${e.op}(${operand})`
    },
  }

  gen(program)
  return output.join("\n")
}
