/**
 * @file rewrite规则管理
 * @author zdying
 */

function Parser () {

}

Parser.prototype = {
  constructor: Parser,

  parse: function () {

  },

  tokenizer: function () {

  }
};

// { type: "punctuation", value: "{" }
// { type: "number", value: 5 }
// { type: "string", value: "Hello World!" }
// { type: "keyword", value: "lambda" }
// { type: "var", value: "a" }

function Tokenizer (source) {
  this.source = source;
  this.index = 0;
}

Tokenizer.prototype = {
  constructor: Tokenizer,
  next: function () {
    this.readWhiteSpace();
    var char = this.source[this.index];

    if (this.isLetter(char)) {
      var chars = this.readChars(this.isLetter);
      return {
        type: 'string',
        value: chars
      };
    } else if (this.isDigit(char)) {
      var chars = this.readChars(this.isDigit);
      return {
        type: 'number',
        value: chars
      };
    } else if (char === '"') {
      this.index++;
      var str = this.readString();
      this.index++;
      return {
        type: 'string',
        value: str
      }
    } else {
      return null;
    }
  },

  readChars: function (pattern) {
    var source = this.source;
    var char = '';
    var result = '';

    while (pattern(char = source[this.index])) {
      this.index++;
      result += char;
    }

    return result;
  },

  readWhiteSpace: function () {
    this.readChars(this.isWhitespace);
  },

  readString: function () {
    var escaped = false;
    return this.readChars(function (char) {
      if (char === '\\') {
        escaped = true;
      }

      var isValid = char !== '"' || escaped;

      if (escaped && char === '"') {
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
    return ' \t\n'.indexOf(ch) >= 0;
  }
};

Parser.Tokenizer = Tokenizer;

module.exports = Parser;

// test
var file = require('path').join(__dirname, 'test.txt');
var source = require('fs').readFileSync(file, 'utf-8');
var tokenizer = new Tokenizer(source);

var token = null;
while (token = tokenizer.next()) {
  console.log(token);
}
