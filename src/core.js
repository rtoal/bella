export function program(statements) {
  return { kind: "Program", statements }
}

export function variableDeclaration(variable, initializer) {
  return { kind: "VariableDeclaration", variable, initializer }
}

export function functionDeclaration(fun, params, body) {
  return { kind: "FunctionDeclaration", fun, params, body }
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

export function variable(name, mutable) {
  return { kind: "Variable", name, mutable }
}

export function fun(name, paramCount) {
  return { kind: "Function", name, paramCount }
}

export const standardLibrary = Object.freeze({
  π: variable("π", false),
  sqrt: fun("sqrt", 1),
  sin: fun("sin", 1),
  cos: fun("cos", 1),
  exp: fun("exp", 1),
  ln: fun("ln", 1),
  hypot: fun("hypot", 2),
})
