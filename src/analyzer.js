// Semantic Analyzer
//
// Analyzes the AST by looking for semantic errors and resolving references.
//
// Semantic analysis is done with the help of a context object, which roughly
// corresponds to lexical scopes in Bella. As Bella features static, nested
// scopes, each context contains not only a mapping of locally declared
// identifiers to their entities, but also a pointer to the static parent
// context. The root context, which contains the pre-declared identifiers and
// any globals, has a parent of null.

import { Variable, Function, standardLibrary, error } from "./core.js"

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
  analyze(node) {
    return this[node.constructor.name](node)
  }
  Program(p) {
    this.analyze(p.statements)
  }
  VariableDeclaration(d) {
    // Analyze the initializer *before* adding the variable to the context,
    // because we don't want the variable to come into scope until after
    // the declaration. That is, "let x=x;" should be an error (unless x
    // was already defined in an outer scope.)
    this.analyze(d.initializer)
    d.variable = new Variable(d.id.lexeme, false)
    this.add(d.id.lexeme, d.variable)
  }
  FunctionDeclaration(d) {
    // Add the function to the context before analyzing the body, because
    // we want to allow functions to be recursive
    d.function = new Function(d.id.lexeme, d.params.length, true)
    this.add(d.id.lexeme, d.function)
    const newContext = new Context(this)
    for (const p of d.params) {
      let variable = new Variable(p.lexeme, true)
      newContext.add(p.lexeme, variable)
      p.value = variable
    }
    newContext.analyze(d.body)
  }
  Assignment(s) {
    this.analyze(s.source)
    this.analyze(s.target)
    if (s.target.value.readOnly) {
      error(`The identifier ${s.target.lexeme} is read only`, s.target)
    }
  }
  WhileStatement(s) {
    this.analyze(s.test)
    this.analyze(s.body)
  }
  PrintStatement(s) {
    this.analyze(s.argument)
  }
  Call(c) {
    this.analyze(c.args)
    c.callee.value = this.get(c.callee, Function)
    const expectedParamCount = c.callee.value.paramCount
    if (c.args.length !== expectedParamCount) {
      error(`Expected ${expectedParamCount} arg(s), found ${c.args.length}`, c.callee)
    }
  }
  Conditional(c) {
    this.analyze(c.test)
    this.analyze(c.consequent)
    this.analyze(c.alternate)
  }
  BinaryExpression(e) {
    this.analyze(e.left)
    this.analyze(e.right)
  }
  UnaryExpression(e) {
    this.analyze(e.operand)
  }
  Token(t) {
    // Shortcut: only handle ids that are variables, not functions, here.
    // We will handle the ids in function calls in the Call() handler. This
    // strategy only works here, but in more complex languages, we would do
    // proper type checking.
    if (t.category === "Id") t.value = this.get(t, Variable)
    if (t.category === "Num") t.value = Number(t.lexeme)
    if (t.category === "Bool") t.value = t.lexeme === "true"
  }
  Array(a) {
    a.forEach(item => this.analyze(item))
  }
}

export default function analyze(programNode) {
  const initialContext = new Context()
  for (const [name, entity] of Object.entries(standardLibrary)) {
    initialContext.add(name, entity)
  }
  initialContext.analyze(programNode)
  return programNode
}
