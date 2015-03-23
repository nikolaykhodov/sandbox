///<reference path='../definitions/node.d.ts'/>
import fs = require('fs');
import parser = require('./parser');
import vm = require('./vm');
import path = require('path');

function squeezeLiteralPaths(rule: vm.Rule): vm.Rule {
    // extract literals
    var literals: Array<string> = rule.options.filter((option) => option.definition === 'literal').map((option) => option.value);

    // leave non-literals only in the option
    rule.options = rule.options.filter((option) => option.definition !== 'literal');

    // get all unique directories (exclude dupes)
    var dirs: { [id:string]: boolean } = {};
    literals.forEach((str: string) => {
        var dir: string = path.dirname(str.replace(/"/g, ''));
        dirs[dir] = true;
    });


    // add extracted dirs to the option list
    Object.keys(dirs).forEach((dir: string) => {
        var definition: string = 'subpath'

        // append a double quote at the end
        dir = dir + '"'

        // make the path user-agnostic
        if(dir.indexOf('/Users/') === 0) {
            dir = dir.replace(/^\/Users\/[A-Za-z0-9_]+\//, '#"^/Users/[A-Za-z0-9]+/');
            definition = 'regexp';
        } else {
            dir = '"' + dir;
        }

        rule.options.push({
            definition: definition,
            value: dir,
            raw: [definition, dir]
        });
    });

    return rule;
}

function processRules(rules: Array<vm.Rule>) : Array<vm.Rule> {
    for(var index: number = 0; index < rules.length; index++) {
        var rule = rules[index];
        if(rule.operation.indexOf('file-') === 0) {
            rules[index] = squeezeLiteralPaths(rule);
        }
    }

    return rules;
}

function dumpRules(rules: Array<vm.Rule>): void {
    rules.forEach((rule: vm.Rule) => {
        var line: string = '(' + (rule.action === vm.Action.Allow ? 'allow' : 'deny') + ' ' + rule.operation;

        if(rule.options.length > 0) {
            line += '\n';
            rule.options.forEach((option: vm.Option, index: number) => {
                if(option.raw.length >= 3) {
                    line += '\t(' + option.raw.join(' ') + ')';
                } else {
                    line += '\t(' + option.definition + ' ' + option.value + ')';
                }

                // don't add a line breaker if it's the last option
                line += (index < rule.options.length - 1) ? '\n' : '';
            });
        }

        line += ')\n';
        console.log(line);
    });
}

var content: string = fs.readFileSync(process.argv[2]).toString();
var _lexer: parser.Lexer = new parser.Lexer('(' + content + ')');
var _parser: parser.Parser = new parser.Parser(_lexer);
var ast: parser.AST = _parser.parse();

var _vm = new vm.VM(ast)
_vm.run();

var rules: Array<vm.Rule> = processRules(_vm.getRules());
dumpRules(rules);