/**
 * @file input stream
 * @author zdying
 */

var Tokenizer = require('./tokenizer');

function Parser (source, filePath) {
  this.tokenizer = new Tokenizer(source, filePath);
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
    var domainValue;
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
          return input.error(
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
            location: this.getLocationValue(tokens),
            body: block
          });
        } else if (tokens[tokens.length - 1].type === 'arrow') {
          // hiproxy.org => {
          this.checkBlock('DomainBlock', parentBlock, firstToken.loc);
          block = this.parseBlock('DomainBlock');
          domainValue = this._getDomainValue(tokens.slice(0, tokens.length - 1));
          body.push({
            type: 'DomainBlock',
            domain: domainValue,
            body: block
          });
        } else if (tokens[1]) {
          // domain hiproxy.org {
          this.checkBlock('DomainBlock', parentBlock, firstToken.loc);
          block = this.parseBlock('DomainBlock');
          domainValue = this._getDomainValue(tokens.slice(1));
          body.push({
            type: 'DomainBlock',
            domain: domainValue,
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

  _getDomainValue: function (tokens) {
    var domainValue = [];

    tokens.forEach(function (token) {
      var val = token.value.replace(/^[,\s]+|[,\s]+$/g, '');

      if (val) {
        domainValue = domainValue.concat(val.split(/,+/));
      }
    });

    return domainValue;
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

  getLocationValue: function (tokens) {
    var value = tokens[1].value;
    var isRegExp = value.indexOf('~') !== -1;

    if (!isRegExp) {
      return value;
    } else {
      /* istanbul ignore else */
      if (tokens[2]) {
        value = tokens[2].value;

        // if start with '//' and end with '/'
        // remove the FIRST and the LAST '/'
        if (/\/\\?\//.test(value) && value.charAt(value.length - 1) === '/') {
          value = value.replace(/^\/|\/$/g, '');
        }

        return new RegExp(value);
      } else {
        this.input.error(
          'Invalid RegExp location config, Regexp location format: ' + '`location ~ /(user|info)/(.*)`'.bold.green,
          tokens[1].loc.start.line,
          tokens[1].loc.start.column + 1
        );
      }
    }
  },

  parseCall: function (tokens) {
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

// test
// var file = require('path').join(__dirname, 'test.txt');
// var source = require('fs').readFileSync(file, 'utf-8');
// var parser = new Parser(source, file);
// var ast = parser.parseToplevel();

// console.log(JSON.stringify(ast, null, 2));
