// Code Generator Bella -> JavaScript
//
// Invoke generate(program) with the program node to get back the JavaScript
// translation as a string.

import { standardLibrary } from "./core.js"

export default function generate(program) {
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

  const gen = node => generators[node.constructor.name](node)

  const generators = {
    Program(p) {
      gen(p.statements)
    },
    VariableDeclaration(d) {
      output.push(`let ${targetName(d.variable)} = ${gen(d.initializer)};`)
    },
    Variable(v) {
      if (v === standardLibrary.π) return "Math.PI"
      return targetName(v)
    },
    FunctionDeclaration(d) {
      const params = d.params.map(targetName).join(", ")
      output.push(`function ${targetName(d.fun)}(${params}) {`)
      output.push(`return ${gen(d.body)};`)
      output.push("}")
    },
    Function(f) {
      const standard = new Map([
        [standardLibrary.sqrt, "Math.sqrt"],
        [standardLibrary.sin, "Math.sin"],
        [standardLibrary.cos, "Math.cos"],
        [standardLibrary.exp, "Math.exp"],
        [standardLibrary.ln, "Math.log"],
        [standardLibrary.hypot, "Math.hypot"],
      ]).get(f)
      return standard ?? targetName(f)
    },
    PrintStatement(s) {
      const argument = gen(s.argument)
      output.push(`console.log(${argument});`)
    },
    Assignment(s) {
      output.push(`${targetName(s.target)} = ${gen(s.source)};`)
    },
    WhileStatement(s) {
      output.push(`while (${gen(s.test)}) {`)
      gen(s.body)
      output.push("}")
    },
    Call(c) {
      const args = gen(c.args)
      const callee = gen(c.callee)
      return `${callee}(${args.join(",")})`
    },
    Conditional(e) {
      return `((${gen(e.test)}) ? (${gen(e.consequent)}) : (${gen(e.alternate)}))`
    },
    BinaryExpression(e) {
      return `(${gen(e.left)} ${e.op} ${gen(e.right)})`
    },
    UnaryExpression(e) {
      return `${e.op}(${gen(e.operand)})`
    },
    Number(e) {
      return e
    },
    Boolean(e) {
      return e
    },
    Array(a) {
      return a.map(gen)
    },
  }

  gen(program)
  return output.join("\n")
}
