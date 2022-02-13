import ast from "./ast.js"
import analyze from "./analyzer.js"
import optimize from "./optimizer.js"
import generate from "./generator.js"

export default function compile(source, outputType) {
  const tree = ast(source)
  if (outputType === "ast") return tree
  const analyzed = analyze(tree)
  if (outputType === "analyzed") return analyzed
  const optimized = optimize(analyzed)
  if (outputType === "optimized") return optimized
  if (outputType === "js") {
    return generate(optimized)
  }
  throw new Error("Unknown output type")
}
