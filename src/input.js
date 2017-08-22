/**
 * @file input stream
 * @author zdying
 */

'use strict';

require('colors');

function Input (source) {
  this.source = source;
  this.index = 0;
  this.column = 0;
  this.line = 1;
}

Input.prototype = {
  constuctor: Input,

  /**
   * Get the next char and move the pointer.
   */
  next: function () {
    var char = this.source.charAt(this.index++);

    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }

    return char;
  },

  /**
   * Get the next char but NOT move the pointer.
   */
  peek: function (offset) {
    return this.source.charAt(this.index + (offset || 0));
  },

  /**
   * Detect whether there is no more char in the input stream.
   */
  eof: function () {
    return this.index >= this.source.length;
  },

  /**
   * print error message
   */
  error: function (msg) {
    this.info(this.line, this.column, msg);
  },

  info: function (line, column, msg) {
    var lines = this.source.split('\n');
    var lineBefore = lines[line - 2];
    var lineAfter = lines[line];
    var maxLen = String(line + (lineAfter != null ? 1 : 0)).length;
    var lineStr = this.getLineNum(line, maxLen, '> '.red) + lines[line - 1];
    var arrowStr = this.getLineNum('', maxLen, '  ') + new Array(column).join(' ') + '^'.red;

    // 25 | set $domain hiproxy.org;
    // 26 | set $string "hiiproxy;
    //    |                      ^
    // 27 | domain $domain {

    var error = [
      'Error: '.bold.red + msg,
      '',
      lineBefore != null ? this.getLineNum(line - 1, maxLen, '  ') + lineBefore : '',
      lineStr,
      arrowStr,
      lineAfter != null ? this.getLineNum(line + 1, maxLen, '  ') + lineAfter : '',
      ''
    ];

    console.log(error.join('\n'));
    process.exit();
  },

  getLineNum: function (num, length, prefix) {
    var delta = length - String(num).length;
    if (delta > 0) {
      num = new Array(delta + 1).join(' ') + num;
    } else {
      num += '';
    }
    return (prefix || '').red + num.blue + ' | '.gray;
  }
};

module.exports = Input;

// text
// var input = new Input('Abcdef "12345\n24333');
// console.log(input.peek()); // A
// console.log(input.peek()); // A
// console.log(input.next()); // A
// console.log(input.peek()); // b
// console.log(input.next()); // b
