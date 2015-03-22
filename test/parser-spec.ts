///<reference path='../definitions/chai.d.ts'/>
///<reference path='../definitions/mocha.d.ts'/>

import chai = require('chai');
import parser = require('./../src/parser')
var expect = chai.expect;

describe('Parser', () => {
	it('should extract all elements from a simple list', (done) => {
		var lexer = new parser.Lexer('(action arg1 arg2 arg3)');
		var syntax = new parser.Parser(lexer);
		var ast = syntax.parse();

		expect(ast).to.deep.equal(['action', 'arg1', 'arg2', 'arg3']);
		done();
	});

	it('should extract all elements from a simple list from a string with line breakers/separators', (done) => {
		var lexer = new parser.Lexer('(action arg1\n arg2 \t\narg3 arg4\n arg5 arg6)');
		var syntax = new parser.Parser(lexer);
		var ast = syntax.parse();

		expect(ast).to.deep.equal(['action', 'arg1', 'arg2', 'arg3', 'arg4', 'arg5', 'arg6']);
		done();
	});

});