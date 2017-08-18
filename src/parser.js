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
      type: 'Block',
      name: 'Program',
      body: []
    };
    // var tokenizer = this.tokenizer;
    // var statement = null;

    // while (!tokenizer.eof()) {
    //   statement = this.parseStatement();
    //   if (statement) {
    //     ast.body.push(statement);
    //   }
    // }

    ast.body = this.parseBlock();

    return ast;
  },

  parseBlock: function () {
    var tokenizer = this.tokenizer;
    var tokens = null;
    var lastToken = null;
    var firstToken = null;
    var type = '';
    var body = [];
    var block = null;
    var call = null;

    while (!tokenizer.eof()) {
      tokens = this.readStatementTokens();

      if (tokens.length === 0) {
        continue;
      }

      lastToken = tokens.pop();
      firstToken = tokens[0];

      type = lastToken.type;

      if (type === 'block_end') {
        break;
      }

      if (type === 'block_start') {
        block = this.parseBlock();

        if (firstToken.type === 'keyword' && firstToken.value === 'location') {
          // location /
          body.push({
            type: 'Block',
            name: 'Location',
            location: tokens.slice(1).map(function (token) { return token.value; }).join(' '),
            // params: tokens,
            body: block
          });
        } else if (tokens[1].type === 'arrow') {
          // hiproxy.org => {
          body.push({
            type: 'Block',
            name: 'Domain',
            domain: tokens[0].value,
            // params: tokens,
            body: block
          });
        } else {
          // domain hiproxy.org {
          body.push({
            type: 'Block',
            name: 'Domain',
            domain: tokens[1].value,
            // params: tokens,
            body: block
          });
        }

        // body.push({
        //   type: 'Block',
        //   params: tokens,
        //   body: block
        // });
      } else if (firstToken && firstToken.type !== 'comment') {
        call = this.parseCall(tokens);
        call && body.push(call);
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
        type === 'express_end' ||
        type === 'line_terminal' ||
        type === 'block_start' ||
        type === 'block_end'
      ) {
        break;
      }
    }
    return tokens;
  },

  parseCall (tokens) {
    if (tokens.length === 0) {
      return null;
    }
    var values = tokens.map(function (token) {
      return token.value;
    });
    var name = tokens.shift();
    var params = tokens;

    // base rules, for example:
    // http://api.hiproxy.org/ => http://hiproxy.org/api/
    if (values.indexOf('=>') > -1) {
      if (values.length === 3) {
        return {
          type: 'Simple Rule',
          left: name,
          right: params.pop()
        };
      } else {
        throw Error('Simple Rule syntax error');
      }
    }

    return {
      type: 'Call',
      directive: name ? name.value : '[Should throw a error or not?]',
      // directive: name.value,
      params: params
    };
  }
};

module.exports = Parser;

// test
// var file = require('path').join(__dirname, 'test.txt');
// var source = require('fs').readFileSync(file, 'utf-8');
// var parser = new Parser(source);
// // var ast = parser.parseBlock();
// var ast = parser.parseToplevel();

// console.log(JSON.stringify(ast, null, 4));
