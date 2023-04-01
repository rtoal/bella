import assert from "node:assert/strict"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"
import optimize from "../src/optimizer.js"
import * as core from "../src/core.js"

// Make some test cases easier to read
const x = new core.Variable("x", false)
const neg = x => new core.UnaryExpression("-", x)
const power = (x, y) => new core.BinaryExpression("**", x, y)
const cond = (x, y, z) => new core.Conditional(x, y, z)
const sqrt = core.standardLibrary.sqrt
const call = (f, args) => new core.Call(f, args)
const letXEq1 = new core.VariableDeclaration(x, 1)
const print = e => new core.PrintStatement(e)
const parameterless = name => new core.Function(name, 0, true)
const program = p => analyze(parse(p))
const expression = e => program(`let x=1; print ${e};`).statements[1].argument

const tests = [
  ["folds +", expression("5 + 8"), 13],
  ["folds -", expression("5 - 8"), -3],
  ["folds *", expression("5 * 8"), 40],
  ["folds /", expression("5 / 8"), 0.625],
  ["folds %", expression("17 % 5"), 2],
  ["folds **", expression("5 ** 8"), 390625],
  ["optimizes +0", expression("x + 0"), x],
  ["optimizes -0", expression("x - 0"), x],
  ["optimizes *1", expression("x * 1"), x],
  ["optimizes /1", expression("x / 1"), x],
  ["optimizes *0", expression("x * 0"), 0],
  ["optimizes 0*", expression("0 * x"), 0],
  ["optimizes 0/", expression("0 / x"), 0],
  ["optimizes 0+", expression("0 + x"), x],
  ["optimizes 0-", expression("0 - x"), neg(x)],
  ["optimizes 1*", expression("1 * x"), x],
  ["folds negation", expression("- 8"), -8],
  ["optimizes 1**", expression("1 ** x"), 1],
  ["optimizes **0", expression("x ** 0"), 1],
  ["optimizes sqrt", expression("sqrt(16)"), 4],
  ["optimizes sin", expression("sin(0)"), 0],
  ["optimizes cos", expression("cos(0)"), 1],
  ["optimizes exp", expression("exp(1)"), Math.E],
  ["optimizes ln", expression("ln(2)"), Math.LN2],
  ["optimizes deeply", expression("8 * (-5) + 2 ** 3"), -32],
  ["optimizes arguments", expression("sqrt(20 + 61)"), 9],
  ["optimizes true conditionals", expression("1?3:5"), 3],
  ["optimizes false conditionals", expression("0?3:5"), 5],
  ["leaves nonoptimizable binaries alone", expression("x ** 5"), power(x, 5)],
  ["leaves 0**0 alone", expression("0 ** 0"), power(0, 0)],
  ["leaves nonoptimizable conditionals alone", expression("x?x:2"), cond(x, x, 2)],
  ["leaves nonoptimizable calls alone", expression("sqrt(x)"), call(sqrt, [x])],
  ["leaves nonoptimizable negations alone", expression("-x"), neg(x)],
  [
    "optimizes in function body",
    program("function f() = 1+1;"),
    new core.Program([new core.FunctionDeclaration(parameterless("f"), [], 2)]),
  ],
  [
    "removes x=x",
    program("let x=1; x=x; print(x);"),
    new core.Program([letXEq1, print(x)]),
  ],
  [
    "optimizes while test",
    program("while sqrt(25) {}"),
    new core.Program([new core.WhileStatement(5, [])]),
  ],
]

describe("The optimizer", () => {
  for (const [scenario, before, after] of tests) {
    it(`${scenario}`, () => {
      assert.deepEqual(optimize(before), after)
    })
  }
})
