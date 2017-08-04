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

    if (char.match(/[a-zA-Z]/)) {
      var chars = this.readChars(function (char) {
        return char.match(/[a-zA-Z]/);
      });
      return {
        type: 'string',
        value: chars
      };
    } else {
      return {};
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

  isKeyword: function (x) {
    return this.keywords.indexOf(' ' + x + ' ') >= 0;
  },
  isDigit: function (ch) {
    return /[0-9]/i.test(ch);
  },
  isId_start: function (ch) {
    return /[a-zλ_]/i.test(ch);
  },
  isId: function (ch) {
    return this.isDdStart(ch) || '?!-<>=0123456789'.indexOf(ch) >= 0;
  },
  isOpChar: function (ch) {
    return '+-*/%=&|<>!'.indexOf(ch) >= 0;
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
var source = '  abc 123 ';
var tokenizer = new Tokenizer(source);

console.log(tokenizer.next());
