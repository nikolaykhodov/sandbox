import parser = require('./parser');

export interface Option {
    definition: string;
    value: string;
    raw: Array<string>;
}

export interface Rule {
    action: Action;
    operation: string;
    options: Array<Option>;
}

export interface FileLine {
    line: string;
    lineNumber: number;
}

export enum Action { Allow, Deny }

export class VM {

    private _rules: Array<Rule>;
    private _version: number;
    private _ast: parser.AST;

    constructor(ast: parser.AST) {
        this._ast = ast;
        this._rules = [];
    }

    setVersion(v: string): void {
        var version = parseInt(v);

        if(isNaN(version)) {
            throw new Error("Version '" + v + "' is not a number");
        }

        this._version = version;
    }

    checkOptions(rawOptions: Array<any>): Array<Option> {
        var options: Array<Option> = [];

        rawOptions.forEach((rawOption: Array<string>) => {
            var definition: string = rawOption[0];
            var value: string = rawOption[1];
            var checkRegexes: { [index: string]: RegExp; } = {
                literal: /^['"].*['"]$/,
                subpath: /^['"]\/.*['"]$/,
                regex: /^#['"]\/.*['"]$/
            };

            if(definition in checkRegexes) {
                var regex: RegExp = checkRegexes[definition];
                if(typeof(value) !== 'string' || regex.test(value) === null) {
                    throw new Error(definition + " value of '" + value + "' is not " + definition);
                }
            }

            options.push({
                definition: rawOption[0],
                value: rawOption[1],
                raw: rawOption
            });
        });

        return options;
    }

    getRules(): Array<Rule> {
        return this._rules;
    }

    addRule(action: Action, operation: string, rawOptions: Array<string>): void {
        var rule: Rule = {
            action: action,
            operation: operation,
            options: this.checkOptions(rawOptions)
        };

        this._rules.push(rule);
    }

    run(): void {
        this._ast.forEach((statement: Array<string>) => {
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