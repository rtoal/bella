import assert from "assert/strict"
import util from "util"
import ast from "../src/ast.js"

const source = `let x=sqrt(9);function f(x)=3*x;while(true){x=3;print(0?f(x):2);}`

const expected = `   1 | Program statements=[#2,#4,#6]
   2 | VariableDeclaration variable=(Id,"x") initializer=#3
   3 | Call callee=(Id,"sqrt") args=[(Num,"9")]
   4 | FunctionDeclaration fun=(Id,"f") params=[(Id,"x")] body=#5
   5 | BinaryExpression op=(Sym,"*") left=(Num,"3") right=(Id,"x")
   6 | WhileStatement test=(Bool,"true") body=[#7,#8]
   7 | Assignment target=(Id,"x") source=(Num,"3")
   8 | PrintStatement argument=#9
   9 | Conditional test=(Num,"0") consequent=#10 alternate=(Num,"2")
  10 | Call callee=(Id,"f") args=[(Id,"x")]`

describe("The AST generator", () => {
  it("produces the expected AST for all node types", () => {
    assert.deepEqual(util.format(ast(source)), expected)
  })
})
