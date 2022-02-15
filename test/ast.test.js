import assert from "assert/strict"
import util from "util"
import ast from "../src/ast.js"

const source = `let x=-1;function f(x)=3*x;while(true){x=3;print(x?f(true):2);}`

const expected = `   1 | Program statements=[#2,#4,#6]
   2 | VariableDeclaration variable=Id("x") initializer=#3
   3 | UnaryExpression op=Sym("-") operand=Num("1")
   4 | FunctionDeclaration fun=Id("f") params=[Id("x")] body=#5
   5 | BinaryExpression op=Sym("*") left=Num("3") right=Id("x")
   6 | WhileStatement test=Bool("true") body=[#7,#8]
   7 | Assignment target=Id("x") source=Num("3")
   8 | PrintStatement argument=#9
   9 | Conditional test=Id("x") consequent=#10 alternate=Num("2")
  10 | Call callee=Id("f") args=[Bool("true")]`

describe("The AST generator", () => {
  it("produces the expected AST for all node types", () => {
    assert.deepEqual(util.format(ast(source)), expected)
  })
})
