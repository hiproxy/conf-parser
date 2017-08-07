/**
 * test input stream
 */

'use strict';

var assert = require('assert');
var Input = require('../src/input');

describe('# Input', function () {
  describe('peek()', function () {
    var input = new Input('abc');

    it('should get the next char', function () {
      assert.equal('a', input.peek());
    });

    it('should get the next char with offset', function () {
      assert.equal('b', input.peek(1));
      assert.equal('c', input.peek(2));
    });

    it('should NOT move the pointer', function () {
      var char0 = input.peek();
      var char1 = input.peek();

      assert.equal(char0, char1);
    });
  });

  describe('next()', function () {
    it('should get the next char', function () {
      var input = new Input('abc');
      assert.equal('a', input.next());
    });

    it('should and move the pointer', function () {
      var input = new Input('abc');
      var char0 = input.next();
      var char1 = input.next();

      assert.equal(char0, 'a');
      assert.equal(char1, 'b');
    });

    it('should add the column and index', function () {
      var input = new Input('abc');
      input.next();
      input.next();

      assert.equal(input.column, 2);
      assert.equal(input.index, 2);
    });

    it('should add the `line`', function () {
      var input = new Input('ab\nc');
      input.next();
      input.next();

      assert.equal(input.line, 1);

      input.next();

      assert.equal(input.line, 2);
    });
  });

  describe('eof()', function () {
    it('should return false when has more character in the string', function () {
      var input = new Input('abc');
      input.next();
      assert.equal(false, input.eof());
    });

    it('should return true when has NO more character in the string', function () {
      var input = new Input('ab');
      input.next();
      input.next();
      assert.equal(true, input.eof());
    });
  });
});
