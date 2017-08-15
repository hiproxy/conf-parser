/**
 * @file input stream
 * @author zdying
 */

var Tokenizer = require('./tokenizer');

function Parser (source) {
  this.tokenizer = new Tokenizer(source);
}

Parser.prototype = {
  constructor: Parser,
  parseToplevel: function () {
    var ast = {
      type: 'Program',
      body: []
    };
    var tokenizer = this.tokenizer;
    var statement = null;

    while (!tokenizer.eof()) {
      statement = this.parseStatement();
      if (statement) {
        ast.body.push(statement);
      }
    }

    return ast;
  },

  parseStatement: function () {
    var tokenizer = this.tokenizer;
    var block = null;

    var tokens = this.readStatementTokens();

    if (tokens.length === 0) {
      return null;
    }

    var token = tokens.pop();
    var type = token.type;

    if (type === 'block_start') {
      block = this.parseBlock();
      return {
        type: 'Block',
        params: tokens,
        body: block
      };
    } else if (!/(line_terminal|comment)/.test(type)) {
      return {type: 'Call', params: tokens};
    } else {
      return null;
    }
  },

  parseBlock: function () {
    var tokenizer = this.tokenizer;
    var tokens = null;
    var token = null;
    var type = '';
    var body = [];
    var block = null;

    while (!tokenizer.eof()) {
      tokens = this.readStatementTokens();

      if (tokens.length === 0) {
        continue;
      }

      token = tokens.pop();
      type = token.type;

      if (type === 'block_end') {
        break;
      }

      if (type === 'block_start') {
        block = this.parseBlock();

        body.push({
          type: 'Block',
          params: tokens,
          body: block
        });
      } else if (!/(line_terminal|comment)/.test(type)) {
        body.push({
          type: 'Call',
          params: tokens
        });
      }
    }

    return body;
  },

  readStatementTokens: function () {
    var tokenizer = this.tokenizer;
    var token = null;
    var type = '';
    var tokens = [];

    // set $A 1234;
    // set $A 1234
    // domain hiproxy.org {
    // hiproxy.org => {
    // }

    while (!tokenizer.eof()) {
      token = tokenizer.next();
      type = token.type;

      tokens.push(token);

      if (
        type === 'express_end'
        || type === 'line_terminal'
        || type === 'block_start'
        || type === 'block_end'
      ) {
        break;
      }/* else {
        tokens.push(token)
      }*/
    }
debugger
    return tokens;
  }
};

// test
var file = require('path').join(__dirname, 'test.txt');
var source = require('fs').readFileSync(file, 'utf-8');
var parser = new Parser(source);
var ast = parser.parseToplevel();

console.log(JSON.stringify(ast, null, 4));