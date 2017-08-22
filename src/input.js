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
    var lineStr = this.getLineNumber(line, line + 1, '>'.red) + lines[line - 1];
    var arrowStr = this.getLineNumber('', line + 1, '  ') + new Array(column).join(' ') + '^'.red;

    // 25 | set $domain hiproxy.org;
    // 26 | set $string "hiiproxy;
    //    |                      ^
    // 27 | domain $domain {

    var error = [
      'Error: '.bold.red + msg,
      lineBefore != null ? this.getLineNumber(line - 1, line + 1, ' ') + lineBefore : '',
      lineStr,
      arrowStr,
      lineAfter != null ? this.getLineNumber(line + 1, line + 1, ' ') + lineAfter : ''
    ];

    console.log(error.join('\n'));
    process.exit();
  },

  getLineNumber: function (num, max, prefix) {
    var maxLen = String(max || num).length + 1;
    return (prefix || '').red + String(Math.pow(10, maxLen) + num).slice(1).replace(/^0+/, ' ').gray + ' | '.gray;
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
