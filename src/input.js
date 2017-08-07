/**
 * @file input stream
 * @author zdying
 */

'use strict';

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
  // error: function (msg) {
  //   throw Error('[Error] line: ' + this.line + ' column: ' + this.column + ':\n' + msg);
  // },

  // info: function (line, column) {
  //   var lines = this.source.split('\n');
  //   var lineStr = line + ' ' + lines[line - 1];
  //   var arrowStr = new Array(column + 1).join(' ') + '^';

  //   console.log(lineStr);
  //   console.log(arrowStr);
  // }
};

module.exports = Input;

// text
// var input = new Input('Abcdef 12345');
// console.log(input.peek()); // A
// console.log(input.peek()); // A
// console.log(input.next()); // A
// console.log(input.peek()); // b
// console.log(input.next()); // b
