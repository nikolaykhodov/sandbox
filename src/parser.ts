interface FileLine {
    line: string;
    lineNumber: number;
}

export interface AST extends Array<any> {};

export class Lexer {

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

        this._tokens = [];
    }

    _splitIntoTokens(line: string) {
        var tokens: Array<string> = [];
        var token: string = '';
        var _line: string = line + ' ';

        var index: number = -1;
        var isSeparator: RegExp = /^\s$/;
        var stringStartsWith: string = '';
        
        while(++index < line.length) {
            var currentSymbol = _line[index];
            var nextSymbol = _line[index + 1];

            if(stringStartsWith) {
                if(currentSymbol === '\\' && nextSymbol === stringStartsWith) {
                    token = token + '\\' + stringStartsWith;
                } else if(currentSymbol === stringStartsWith) {
                    tokens.push(token + currentSymbol);
                    stringStartsWith = '';
                    token = '';
                } else {
                    token = token + currentSymbol;
                }               
            } else {
                if(token === '') {
                    if(isSeparator.test(currentSymbol)) {
                        continue;
                    } else if (currentSymbol === '"' || currentSymbol === "'") {
                        stringStartsWith = currentSymbol;
                        token = currentSymbol;
                    } else if (currentSymbol === '(' || currentSymbol === ')') {
                        tokens.push(currentSymbol);
                        token = '';
                    } else {
                        token = currentSymbol;
                    }
                } else {
                    if(isSeparator.test(currentSymbol)) {
                        tokens.push(token);
                        token = '';
                    } else if (currentSymbol === '(' || currentSymbol === ')') {
                        tokens.push(token);
                        tokens.push(currentSymbol);
                        token = '';
                    } else {
                        token = token + currentSymbol;
                    }
                }
            }
        }

        return tokens;
    }

    _updateTokens() {
        if(this._tokens.length === 0) {
            var entry = this._entries.shift();
            if(!entry) {
                throw new Error('Unexpected EOF');
            }

            this._currentLine = entry.lineNumber;
            this._tokens = this._splitIntoTokens(entry.line);
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

export class Parser {
    private _lexer: Lexer;

    constructor(lexer: Lexer) {
        this._lexer = lexer;
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
        if (this._lexer.eof()) {
            throw new Error('unexpected EOF while reading at line '  + this._lexer.currentLine());
        }

        while(!this._lexer.eof()) {
            var token = this._lexer.nextToken();

            if ('(' === token) {
                var statements: Array<any> = [];
                
                while(this._lexer.currentToken() !== ')') {
                    statements.push(this.parse());
                }
                this._lexer.nextToken();

                return statements;
            } else if (')' === token) {
                throw new Error('unexpected ) at line ' + this._lexer.currentLine());
            } else {
                return this.atomize(token);
            }
        }
    }
}
