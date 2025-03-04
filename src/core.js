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
  sqrt: fun("sqrt", [variable("x")]),
  sin: fun("sin", [variable("x")]),
  cos: fun("cos", [variable("x")]),
  exp: fun("exp", [variable("x")]),
  ln: fun("ln", [variable("x")]),
  hypot: fun("hypot", [variable("x"), variable("y")]),
})
