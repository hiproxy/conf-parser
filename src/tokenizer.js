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
function Tokenizer (source) {
  this.input = new Input(source);
}

Tokenizer.prototype = {
  constructor: Tokenizer,

  next: function () {
    var input = this.input;
    var char = '';
    var token = null;

    if (input.eof()) {
      return token;
    }

    this.readWhiteSpace();

    char = input.peek();

    switch (char) {
      case '':
        // 空白
        break;

      case '\'':
      case '"':
        input.next();
        var str = this.readString(char);
        token = {
          type: 'string',
          value: str
        }
        input.next();
        break;

      case '#':
        var comment = this.readChars(function (char) {
          return char !== '\r' && char !== '\n';
        });

        token = {
          type: 'comment',
          value: comment
        }
        break;

      case ';':
        token = {
          type: 'express_end',
          value: char
        }
        input.next();
        break;
      
      case '{':
        token = {
          type: 'block_start',
          value: char
        }
        input.next();       
        break;
      case '}':
        token = {
          type: 'block_end',
          value: char
        }
        input.next();   
        break;
      
      case '\r':
      case '\n':
        token = {
          type: 'line_terminal'
        }
        input.next();
        break;

      case '=':
        var arrow = this.readArrow();

        if (arrow) {
          token = {
            type: 'arrow',
            value: arrow
          }
          // input.info(input.line, input.column - 2);
          break;
        }

      default:
        var word = this.readChars(function (char) {
          return ' \n\r\t;'.indexOf(char) === -1;
        })
        token = {
          type: 'word',
          value: word
        }
        break;
    }

    return token;
  },

  readChars: function (pattern) {
    var source = this.source;
    var char = '';
    var result = '';
    var input = this.input;

    while (pattern(input.peek())) {
      result += input.next();
    }

    return result;
  },

  readWhiteSpace: function () {
    this.readChars(this.isWhitespace);
  },

  readString: function (quote) {
    var escaped = false;
    var self = this;

    quote = quote || '"';

    return this.readChars(function (char) {
      if (char === '\\') {
        escaped = true;
        return true;
      } else {
        var isValid = char !== quote || escaped;
        escaped = false;

        return isValid;
      }
    })
  },

  readArrow: function () {
    var source = this.source;
    var input = this.input;
    var char = input.peek();
    var nextChar = input.peek(1);

    if (nextChar === '>') {
      input.next();
      input.next();
      return '=>';
    } else {
      return '';
    }
  },

  isLetter: function (ch) {
    return /[a-zA-Z]/.test(ch);
  },
  isDigit: function (ch) {
    return /[0-9]/i.test(ch);
  },
  isPunc: function (ch) {
    return ';(){}[]'.indexOf(ch) >= 0;
  },
  isWhitespace: function (ch) {
    return ch && ' \t'.indexOf(ch) >= 0;
  }
};

module.exports = Tokenizer;

// test
var file = require('path').join(__dirname, 'test.txt');
var source = require('fs').readFileSync(file, 'utf-8');
var tokenizer = new Tokenizer(source);

var token = null;
var tokens = [];

var start = new Date();

while (token = tokenizer.next()) {
  // console.log(token);
  tokens.push(token);
}

var end = new Date();

console.log('==========================================================');
for (var i = 0, len = tokens.length; i < len; i++) {
  console.log(tokens[i]);
}
console.log('==========================================================');

console.log('[', tokens.length, ']', 'tokens has been scanned in', end - start,  'ms');