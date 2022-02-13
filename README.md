![Logo](https://raw.githubusercontent.com/rtoal/bella/main/docs/bellalogo.png)

# Bella

A simple programming language, used for a compiler course.

```
let dozen = 12;
print(dozen % 3 ** 1);
function gcd(x, y) = return y == 0 ? x : gcd(y, x % y);
while (dozen >= 3 || (gcd(1, 10) != 5)) {
  let y = 0;
  dozen = dozen - 2.75E+19 ** 1 ** 3;
}
```

## Language Specification

The language is specified at its [home page](http://localhost/~ray/notes/bella/).

## Building

Nodejs is required to build and run this project. Make sure you have a recent version of Node, since the source code uses a fair amount of very modern JavaScript.

Clone the repo, then run `npm install`.

You can then run `npm test`.

## Usage

To run from the command line:

```
node src/bella.js <filename> <outputType>
```

The `outputType` indicates what you wish to print to standard output:

<table>
<tr><th>Option</th><th>Description</th></tr>
<tr><td>ast</td><td>The AST</td></tr>
<tr><td>analyzed</td><td>The decorated AST</td></tr>
<tr><td>optimized</td><td>The optimized decorated AST</td></tr>
<tr><td>js</td><td>The translation of the program to JavaScript</td></tr>
</table>

Example runs:

```
$ cat ~/hi.bella
let good_dog = 100;
print(exp(100) - 0);

$ node src/bella.js ~/hi.bella ast
   1 | Program statements=[#2,#3]
   2 | VariableDeclaration id=Id("good_dog") initializer=Num("100")
   3 | PrintStatement argument=#4
   4 | BinaryExpression op=Sym("-") left=#5 right=Num("0")
   5 | Call callee=Id("exp") args=[Num("100")]

$ node src/bella.js ~/hi.bella analyzed
   1 | Program statements=[#2,#4]
   2 | VariableDeclaration id=Id("good_dog") initializer=Num("100",100) variable=#3
   3 | Variable name='good_dog' readOnly=false
   4 | PrintStatement argument=#5
   5 | BinaryExpression op=Sym("-") left=#6 right=Num("0")
   6 | Call callee=Id("exp",#7) args=[Num("100",100)]
   7 | Function name='exp' paramCount=1 readOnly=true

$ node src/bella.js ~/hi.bella optimized
   1 | Program statements=[#2,#4]
   2 | VariableDeclaration id='good_dog' initializer=100 variable=#3
   3 | Variable name='good_dog' readOnly=false
   4 | PrintStatement argument=2.6881171418161356e+43

$ node src/bella.js ~/hi.bella js
let good_dog_1 = 100;
console.log(2.6881171418161356e+43);
```

## Contributing

I’m happy to take PRs. As usual, be nice when filing issues and contributing. Do remember the idea is to keep the language tiny; if you’d like to extend the language, you’re probably better forking into a new project. However, I would love to see any improvements you might have for the implementation or the pedagogy.

Make sure to run `npm test` before submitting the PR.

![GoodDog](https://raw.githubusercontent.com/rtoal/bella/main/docs/bella.jpg)
