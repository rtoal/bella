import assert from "assert/strict"
import stringify from "graph-stringify"
import analyze from "../src/analyzer.js"

const semanticChecks = [
  ["variables can be printed", "let x = 1; print x;"],
  ["variables can be reassigned", "let x = 1; x = x * 5 / ((-3) + x);"],
  ["all predefined identifiers", "print ln(sqrt(sin(cos(hypot(π,1) + exp(5.5E2)))));"],
]

const semanticErrors = [
  ["using undeclared identifiers", "print(x);", /x has not been declared/],
  ["a variable used as function", "x = 1; x(2);", /Expected "="/],
  ["a function used as variable", "print(sin + 1);", /expected/],
  ["re-declared identifier", "let x = 1; let x = 2;", /x has already been declared/],
  ["an attempt to write a read-only var", "π = 3;", /π is read only/],
  ["too few arguments", "print(sin());", /Expected 1 arg\(s\), found 0/],
  ["too many arguments", "print(sin(5, 10));", /Expected 1 arg\(s\), found 2/],
]

const sample = `let x=sqrt(9);function f(x)=3*x;while(true){x=3;print(0?f(x):2);}`

const expected = `   1 | Program statements=[#2,#6,#10]
   2 | VariableDeclaration variable=#3 initializer=#4
   3 | Variable name='x' readOnly=false
   4 | Call callee=#5 args=[9]
   5 | Function name='sqrt' paramCount=1 readOnly=true
   6 | FunctionDeclaration fun=#7 params=[#8] body=#9
   7 | Function name='f' paramCount=1 readOnly=true
   8 | Variable name='x' readOnly=true
   9 | BinaryExpression op='*' left=3 right=#8
  10 | WhileStatement test=true body=[#11,#12]
  11 | Assignment target=#3 source=3
  12 | PrintStatement argument=#13
  13 | Conditional test=0 consequent=#14 alternate=2
  14 | Call callee=#7 args=[#3]`

describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(analyze(source))
    })
  }
  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(source), errorMessagePattern)
    })
  }
  it(`produces the expected graph for the simple sample program`, () => {
    assert.deepEqual(stringify(analyze(sample)), expected)
  })
})
