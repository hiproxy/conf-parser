/**
 * @file input stream
 * @author zdying
 */

var Tokenizer = require('./tokenizer');

function Parser (source) {
  this.tokenizer = new Tokenizer(source);
  this.input = this.tokenizer.input;
}

Parser.prototype = {
  constructor: Parser,
  parseToplevel: function () {
    var ast = {
      type: 'GlobalBlock',
      body: []
    };

    ast.body = this.parseBlock(ast.type);

    return ast;
  },

  parseBlock: function (parentBlock) {
    var tokenizer = this.tokenizer;
    var input = this.input;
    var tokens = null;
    var lastToken = null;
    var firstToken = null;
    var type = '';
    var body = [];
    var block = null;
    var call = null;

    while (!tokenizer.eof()) {
      tokens = this.readStatementTokens();

      /* istanbul ignore if */
      if (tokens.length === 0) {
        continue;
      }

      lastToken = tokens[tokens.length - 1];
      firstToken = tokens[0];

      type = lastToken.type;

      if (
        type === 'block_start' ||
        type === 'block_end' ||
        type === 'line_terminal' ||
        type === 'express_end'
      ) {
        tokens.pop();
      }

      if (type === 'block_end') {
        break;
      }

      if (type === 'block_start') {
        if (tokens.length < 2) {
          input.error(
            'Unexpected ' + (parentBlock === 'GlobalBlock' ? 'DomainBlock' : 'LocationBlock') + ' declaration',
            (firstToken || lastToken).loc.start.line,
            (firstToken || lastToken).loc.start.column
          );
        }

        if (firstToken.type === 'keyword' && firstToken.value === 'location') {
          // location /
          this.checkBlock('LocationBlock', parentBlock, firstToken.loc);
          block = this.parseBlock('LocationBlock');
          body.push({
            type: 'LocationBlock',
            location: tokens.slice(1).map(function (token) { return token.value; }).join(' '),
            body: block
          });
        } else if (tokens[1] && tokens[1].type === 'arrow') {
          // hiproxy.org => {
          this.checkBlock('DomainBlock', parentBlock, firstToken.loc);
          block = this.parseBlock('DomainBlock');
          body.push({
            type: 'DomainBlock',
            domain: tokens[0].value,
            body: block
          });
        } else if (tokens[1]) {
          // domain hiproxy.org {
          this.checkBlock('DomainBlock', parentBlock, firstToken.loc);
          block = this.parseBlock('DomainBlock');
          body.push({
            type: 'DomainBlock',
            domain: tokens[1].value,
            body: block
          });
        }
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
    /* istanbul ignore if */
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
          type: 'SimpleRule',
          left: name,
          right: params.pop()
        };
      } else {
        this.input.error(
          'Simple Rule syntax error',
          tokens[0].loc.start.line,
          tokens[0].loc.start.column
        );
      }
    }

    if (this.isSet(name)) {
      return {
        type: 'VariableDeclaration',
        declaration: {
          id: params.shift(),
          value: params
        }
      };
    }

    // if (this.isProxyPass(name)) {
    //   return {
    //     type: 'VariableDeclaration',
    //     declaration: {
    //       id: '$proxy_pass',
    //       value: params
    //     }
    //   };
    // }
    return {
      type: 'CallExpression',
      directive: name.value,
      arguments: params
    };
  },

  isSet: function (token) {
    return token && token.value === 'set';
  },

  // isProxyPass: function (token) {
  //   return token && token.value === 'proxy_pass';
  // },

  checkBlock: function (curBlock, parentBlock, loc) {
    var input = this.input;
    var order = ['GlobalBlock', 'DomainBlock', 'LocationBlock'];
    var curIndex = order.indexOf(curBlock);
    var parentIndex = order.indexOf(parentBlock);

    if (curIndex - parentIndex !== 1) {
      input.error(
        curBlock + ' should be wrapped in ' + order[curIndex - 1],
        loc.start.line,
        loc.start.column
      );
    }
  }
};

module.exports = Parser;

// // test
// var file = require('path').join(__dirname, 'test.txt');
// var source = require('fs').readFileSync(file, 'utf-8');
// var parser = new Parser(source);
// var ast = parser.parseToplevel();

// console.log(JSON.stringify(ast, null, 2));
