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
    p.statements = this.analyze(p.statements)
    return p
  }
  VariableDeclaration(d) {
    // Analyze the initializer *before* adding the variable to the context,
    // because we don't want the variable to come into scope until after
    // the declaration. That is, "let x=x;" should be an error (unless x
    // was already defined in an outer scope.)
    d.initializer = this.analyze(d.initializer)
    this.add(d.id.lexeme, new Variable(d.id.lexeme, false))
    return d
  }
  FunctionDeclaration(d) {
    // Add the function to the context before analyzing the body, because
    // we want to allow functions to be recursive
    this.add(d.id.lexeme, new Function(d.id.lexeme, d.params.length, true))
    const newContext = new Context(this)
    for (const p of d.params) newContext.add(p.lexeme, new Variable(p.lexeme, true))
    d.body = newContext.analyze(d.body)
    return d
  }
  Assignment(s) {
    const id = s.target
    s.source = this.analyze(s.source)
    s.target = this.analyze(s.target)
    if (s.target.readOnly) {
      error(`The identifier ${id.lexeme} is read only`, id)
    }
    return s
  }
  WhileStatement(s) {
    s.test = this.analyze(s.test)
    s.body = this.analyze(s.body)
    return s
  }
  PrintStatement(s) {
    s.argument = this.analyze(s.argument)
    return s
  }
  Call(c) {
    c.args = this.analyze(c.args)
    c.callee.value = this.get(c.callee, Function)
    const expectedParamCount = c.callee.value.paramCount
    if (c.args.length !== expectedParamCount) {
      error(`Expected ${expectedParamCount} arg(s), found ${c.args.length}`, c.callee)
    }
    return c
  }
  Conditional(c) {
    c.test = this.analyze(c.test)
    c.consequent = this.analyze(c.consequent)
    c.alternate = this.analyze(c.alternate)
    return c
  }
  BinaryExpression(e) {
    e.left = this.analyze(e.left)
    e.right = this.analyze(e.right)
    return e
  }
  UnaryExpression(e) {
    e.operand = this.analyze(e.operand)
    return e
  }
  Token(t) {
    // Shortcut: only handle ids that are variables here, when we analyze
    // calls we won't dive in here. This shortcut won't work well in
    // languages with more types.
    if (t.category === "Id") t.value = this.get(t, Variable)
    if (t.category === "Num") t.value = Number(t.lexeme)
    if (t.category === "Bool") t.value = t.lexeme === "true"
    return t
  }
  Array(a) {
    return a.map(item => this.analyze(item))
  }
}

export default function analyze(programNode) {
  const initialContext = new Context()
  for (const [name, entity] of Object.entries(standardLibrary)) {
    initialContext.add(name, entity)
  }
  return initialContext.analyze(programNode)
}
