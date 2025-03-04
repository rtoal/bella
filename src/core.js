export function program(statements) {
  return { kind: "Program", statements }
}

export function variableDeclaration(variable, initializer) {
  return { kind: "VariableDeclaration", variable, initializer }
}

export function variable(name, mutable = false) {
  return { kind: "Variable", name, mutable }
}

export function functionDeclaration(fun) {
  return { kind: "FunctionDeclaration", fun }
}

export function fun(name, params, body) {
  return { kind: "Function", name, params, body }
}

export function intrinsicFunction(name, params) {
  return { kind: "Function", name, params }
}

export function assignment(target, source) {
  return { kind: "Assignment", target, source }
}

export function whileStatement(test, body) {
  return { kind: "WhileStatement", test, body }
}

export function printStatement(argument) {
  return { kind: "PrintStatement", argument }
}

export function call(callee, args) {
  return { kind: "Call", callee, args }
}

export function conditional(test, consequent, alternate) {
  return { kind: "Conditional", test, consequent, alternate }
}

export function binary(op, left, right) {
  return { kind: "BinaryExpression", op, left, right }
}

export function unary(op, operand) {
  return { kind: "UnaryExpression", op, operand }
}

export const standardLibrary = Object.freeze({
  π: variable("π", false),
  sqrt: intrinsicFunction("sqrt", [variable("x")]),
  sin: intrinsicFunction("sin", [variable("x")]),
  cos: intrinsicFunction("cos", [variable("x")]),
  exp: intrinsicFunction("exp", [variable("x")]),
  ln: intrinsicFunction("ln", [variable("x")]),
  hypot: intrinsicFunction("hypot", [variable("x"), variable("y")]),
})
