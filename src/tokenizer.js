/**
 * @file tokenizer
 * @author zdying
 */

'use strict';

var Input = require('./input');

/**
 * Constructor
 *
 * @param {any} source
 */
function Tokenizer (source, filePath) {
  this.input = new Input(source, filePath);
}

Tokenizer.prototype = {
  constructor: Tokenizer,

  keywords: [
    'set',
    'domain',
    'location'
  ],

  next: function () {
    var input = this.input;
    var char = '';
    var token = null;
    var startIndex = 0;
    var startLine = 0;
    var startColumn = 0;

    if (input.eof()) {
      return token;
    }

    this.readWhiteSpace();

    char = input.peek();

    startIndex = input.index;
    startColumn = input.column;
    startLine = input.line;

    switch (char) {
      case '':
        break;
      case '\'':
      case '"':
        input.next();
        var str = this.readString(char);
        token = {
          type: 'string',
          value: str
        };
        input.next();
        break;

      case '#':
        var comment = this.readWhile(function (char) {
          return char !== '\r' && char !== '\n';
        });

        token = {
          type: 'comment',
          value: comment
        };
        break;

      case ';':
        token = {
          type: 'express_end',
          value: char
        };
        input.next();
        break;

      case '{':
        token = {
          type: 'block_start',
          value: char
        };
        input.next();
        break;
      case '}':
        token = {
          type: 'block_end',
          value: char
        };
        input.next();
        break;

      case '\r':
      case '\n':
        token = {
          type: 'line_terminal'
        };
        input.next();
        break;

      case '=':
        var arrow = this.readArrow();

        if (arrow) {
          token = {
            type: 'arrow',
            value: arrow
          };
        } else {
          token = {
            type: 'word',
            value: this.readWord()
          };
        }

        break;

      default:
        var word = this.readWord();
        var isKeyword = this.keywords.indexOf(word) > -1;
        token = {
          type: isKeyword ? 'keyword' : 'word',
          value: word
        };
        break;
    }

    if (token) {
      token.loc = {
        start: {
          line: startLine,
          column: startColumn,
          index: startIndex
        },
        end: {
          line: input.line,
          column: input.column,
          index: input.index
        },
        toJSON: /* istanbul ignore next */function () { return undefined; }
      };
    }

    return token;
  },

  readWhile: function (pattern) {
    var result = '';
    var input = this.input;
    var char = '';

    while (!input.eof() && pattern(input.peek())) {
      char = input.next();
      result += char !== '\\' ? char : '';
    }

    return result;
  },

  readWhiteSpace: function () {
    return this.readWhile(this.isWhitespace);
  },

  readString: function (quote) {
    var escaped = false;
    var input = this.input;
    var str = this.readWhile(function (char) {
      if (char === '\\') {
        escaped = true;
        return true;
      } else if ('\n\r'.indexOf(char) !== -1) {
        input.error('Unterminated string constant');
      } else {
        var isValid = char !== quote || escaped;
        escaped = false;

        return isValid;
      }
    });

    if (input.eof() && input.peek(-1) !== quote) {
      input.error('Unterminated string constant');
    }

    return str;
  },

  readWord: function () {
    return this.readWhile(function (char) {
      return ' \n\r\t;{}'.indexOf(char) === -1;
    });
  },

  readArrow: function () {
    var input = this.input;
    var nextChar = input.peek(1);

    if (nextChar === '>') {
      input.next();
      input.next();
      return '=>';
    } else {
      return '';
    }
  },

  isWhitespace: function (ch) {
    return ch && ' \t\u2028\u2029\u3000'.indexOf(ch) >= 0;
  },

  eof: function () {
    return this.input.eof();
  }
};

module.exports = Tokenizer;

// console.log(tok);

// // test
// var file = require('path').join(__dirname, 'test.txt');
// var source = require('fs').readFileSync(file, 'utf-8');
// var tokenizer = new Tokenizer(source);

// var token = null;
// var tokens = [];

// var start = new Date();

// while ((token = tokenizer.next())) {
//   // console.log(token);
//   tokens.push(token);
// }

// var end = new Date();

// console.log('==========================================================');
// for (var i = 0, len = tokens.length; i < len; i++) {
//   console.log(tokens[i]);
// }
// console.log('==========================================================');

// console.log('[', tokens.length, ']', 'tokens has been scanned in', end - start, 'ms');
