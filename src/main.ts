///<reference path='../definitions/node.d.ts'/>
import fs = require('fs');
import parser = require('./parser');
import vm = require('./vm');

function processRules(rules: Array<vm.Rule>): void {
    var rule: vm.Rule = rules.filter((rule: vm.Rule) => {
        return rule.operation === 'file-read*';
    })[0];

    var options = rule.options;
    var literals = options.filter((option) => option.definition === 'literal').map((option) => option.value);
    literals = literals.sort();
}

var content: string = fs.readFileSync(process.argv[2]).toString();
var _lexer: parser.Lexer = new parser.Lexer('(' + content + ')');
var _parser: parser.Parser = new parser.Parser(_lexer);
var ast: parser.AST = _parser.parse();

console.log(ast);

var _vm = new vm.VM(ast)
_vm.run();

var rules: Array<vm.Rule> = _vm.getRules();
processRules(rules);