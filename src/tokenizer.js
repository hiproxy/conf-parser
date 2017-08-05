/**
 * @file tokenizer
 * @author zdying
 */

// { type: "punctuation", value: "{" }
// { type: "number", value: 5 }
// { type: "string", value: "Hello World!" }
// { type: "keyword", value: "lambda" }
// { type: "var", value: "a" }

/**
 * Constructor
 * 
 * @param {any} source 
 */
function Tokenizer (source) {
  this.source = source;
  this.index = 0;
}

Tokenizer.prototype = {
  constructor: Tokenizer,

  next: function () {
    if (this.eof()) {
      return null;
    }

    this.readWhiteSpace();
    var char = this.source.charAt(this.index);
    var token = null;

    switch (char) {
      case '':
        // 空白
        break;

      case '\'':
      case '"':
        this.index++;
        var str = this.readString(char);
        token = {
          type: 'string',
          value: str
        }
        this.index++;
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
        this.index++;
        break;
      
      case '{':
        token = {
          type: 'block_start',
          value: char
        }
        this.index++;        
        break;
      case '}':
        token = {
          type: 'block_end',
          value: char
        }
        this.index++;        
        break;
      
      case '\r':
      case '\n':
        token = {
          type: 'line_terminal'
        }
        this.index++; 
        break;

      default:
        var word = this.readChars(function (char) {
          // return !/[\r\n\s\t;]/.test(char);
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

    while (pattern(char = source.charAt(this.index))) {
      this.index++;
      result += char;
    }

    return result;
  },

  readWhiteSpace: function () {
    this.readChars(this.isWhitespace);
  },

  readString: function (quote) {
    var escaped = false;

    quote = quote || '"';

    return this.readChars(function (char) {
      if (char === '\\') {
        escaped = true;
      }

      var isValid = char !== quote || escaped;

      if (escaped && char === quote) {
        escaped = false;
      }
      
      return isValid;
    })
  },

  isLetter: function (ch) {
    return /[a-zA-Z]/.test(ch);
  },
  isDigit: function (ch) {
    return /[0-9]/i.test(ch);
  },
  isPunc: function (ch) {
    return ',;(){}[]'.indexOf(ch) >= 0;
  },
  isWhitespace: function (ch) {
    return ch && ' \t'.indexOf(ch) >= 0;
  },

  eof: function () {
    return this.index >= this.source.index;
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

console.log('===================================');
for (var i = 0, len = tokens.length; i < len; i++) {
  console.log(tokens[i]);
}
console.log('===================================');

console.log('[', tokens.length, ']', 'tokens has been scanned in', end - start,  'ms');