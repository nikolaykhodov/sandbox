///<reference path='node.d.ts'/>
import fs = require('fs');

enum Action { Allow, Deny }

interface AST extends Array<any> {};

interface Option {
    definition: string;
    value: string;
}

interface Rule {
    action: Action;
    operation: string;
    options: Array<Option>;
}

interface FileLine {
    line: string;
    lineNumber: number;
}

class Tokenizer {

    private _tokens: Array<string>;
    private _entries: Array<FileLine>;
    private _currentLine: number;

    constructor(content: string) {
        var lines: Array<string> = content.replace(/\r\n/g, () => "\n").split(/\n/g);

        this._entries = lines.map((line, index) => {
            return {
                line: line.trim(), 
                lineNumber: index
            }
        });
        // strip empty lines
        this._entries = this._entries.filter((entry) => entry.line !== '')
        // strip comments
        this._entries = this._entries.filter((entry) => entry.line.slice(0,1) !== ';');

        console.log(this._entries);

        this._tokens = [];
    }

    _splitIntoTokens(line: string) {
        return line.replace(/\(/g, (s) => ' ( ').replace(/\)/g, (s) => ' ) ').split(' ').filter((token) => token !== '');
    }

    _updateTokens() {
        if(this._tokens.length === 0) {
            var entry = this._entries.shift();
            if(!entry) {
                throw new Error('Unexpected EOF');
            }
            this._tokens = this._splitIntoTokens(entry.line);
            this._currentLine = entry.lineNumber;
        }
    }

    nextToken(): string {
        this._updateTokens();
        return this._tokens.shift();
    }

    currentToken(): string {
        this._updateTokens();
        return this._tokens[0];
    }

    currentLine(): number {
        return this._currentLine;
    }

    eof(): boolean {
        return this._tokens.length === 0 && this._entries.length === 0;
    }
}

class Parser {
    private _tokenizer: Tokenizer;

    constructor(tokenizer: Tokenizer) {
        this._tokenizer = tokenizer;
    }

    atomize(value: any) : any {
        var newValue = parseInt(value);
        
        if(isNaN(newValue)) {
            newValue = parseFloat(value);
        }
        
        if(isNaN(newValue)) {
            newValue = value.toString();
        }

        return newValue;
    }

    parse() : AST {
        if (this._tokenizer.eof()) {
            throw new Error('unexpected EOF while reading at line '  + this._tokenizer.currentLine());
        }

        while(!this._tokenizer.eof()) {
            var token = this._tokenizer.nextToken();

            if ('(' === token) {
                var statements: Array<any> = [];
                
                while(this._tokenizer.currentToken() !== ')') {
                    statements.push(this.parse());
                }
                this._tokenizer.nextToken();

                return statements;
            } else if (')' === token) {
                throw new Error('unexpected ) at line ' + this._tokenizer.currentLine());
            } else {
                return this.atomize(token);
            }
        }
    }
}

class VM {

    rules: Array<Rule>;
    version: number;
    ast: AST;

    constructor(ast: AST) {
        this.ast = ast;
    }

    setVersion(v: string): void {
        var version = parseInt(v);

        if(isNaN(version)) {
            throw new Error("Version '" + v + "' is not a number");
        }

        this.version = version;
    }

    addRule(action: Action, operation: string, ...options: any[]): void {
        //var rule: Rule = new Rule();

        //rule.action = action;
    }

    run(): void {
        this.ast.forEach((statement: Array<string>) => {
            var action: string = statement[0];
            var operation: string = statement[1];
            var options: Array<string> = statement.slice(2);

            switch(action) {
                case 'version':
                    this.setVersion(operation);
                    break;
                case 'allow':
                    this.addRule(Action.Allow, operation, options);
                    break;
                case 'deny':
                    this.addRule(Action.Deny, operation, options);
                    break;
                default:
                    throw new Error('Unknown action: ' + action);

            }
        });
    }
}

var content: string = fs.readFileSync(process.argv[2]).toString();
var tokenizer = new Tokenizer('(' + content + ')');
var parser = new Parser(tokenizer);
var ast: AST = parser.parse();

console.log(ast);

var vm = new VM(ast)
vm.run();

console.log(vm.rules);