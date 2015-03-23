///<reference path='../definitions/chai.d.ts'/>
///<reference path='../definitions/mocha.d.ts'/>

import chai = require('chai');
import parser = require('./../src/parser');
import vm = require('./../src/vm');
var expect = chai.expect;

describe('VM', () => {
	it('should extract options composed of more than 2 parts', (done) => {
		var lexer = new parser.Lexer('((allow network-outbound (remote tcp "*:10194") (remote udp "localhost:65000")))');
		var syntax = new parser.Parser(lexer);
		var VM = new vm.VM(syntax.parse());
		VM.run();

		var rule = VM.getRules()[0];
		expect(rule.options[0].raw).to.deep.equal(['remote', 'tcp', '"*:10194"']);
		expect(rule.options[1].raw).to.deep.equal(['remote', 'udp', '"localhost:65000"']);
		done();
	});
});