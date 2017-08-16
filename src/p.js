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
    var call = null;

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
    } else if (tokens.length && tokens[0].type !== 'comment') {
      return this.parseCall(tokens);
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
    var call = null;
    var firstToken = null;

    while (!tokenizer.eof()) {
      tokens = this.readStatementTokens();

      if (tokens.length === 0) {
        continue;
      }

      token = tokens.pop();
      type = token.type;
      firstToken = tokens[0];

      if (type === 'block_end') {
        break;
      }

      if (type === 'block_start') {
        block = this.parseBlock();

        if (firstToken.type === 'keyword' && firstToken.value === 'location') {
          // location /
          body.push({
            type: 'Block',
            location: tokens[1].value,
            // params: tokens,
            body: block
          });
        } else if (tokens[1].type === 'arrow') {
          // hiproxy.org => {
          body.push({
            type: 'Block',
            domain: tokens[0].value,
            // params: tokens,
            body: block
          });
        } else {
          // domain hiproxy.org {
          body.push({
            type: 'Block',
            domain: tokens[1].value,
            // params: tokens,
            body: block
          })
        }

        // body.push({
        //   type: 'Block',
        //   params: tokens,
        //   body: block
        // });
      } else {
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
        }
      } else {
        throw Error('Simple Rule syntax error');
      }
    }

    return {
      type: 'Call',
      directive: name ? name.value : '[Should throw a error or not?]',
      // directive: name.value,
      params: params
    }
  }
};

// test
var file = require('path').join(__dirname, 'test.txt');
var source = require('fs').readFileSync(file, 'utf-8');
var parser = new Parser(source);
var ast = parser.parseToplevel();

console.log(JSON.stringify(ast, null, 4));