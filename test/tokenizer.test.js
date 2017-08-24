/**
 * test input stream
 */

'use strict';

var assert = require('assert');
var Tokenizer = require('../src/tokenizer');

describe('# Tokenizer', function () {
  describe('next()', function () {
    var lastMessage = '';

    before(function () {
      global.logger = function (message) {
        lastMessage = message;
      };
    });
    it('should get `comment` token rightly', function () {
      var tokenizer = new Tokenizer('# comment text');
      var tok = tokenizer.next();
      assert.equal('comment', tok.type);
      assert.equal('# comment text', tok.value);
    });

    it('should get `word` token rightly', function () {
      var tokenizer = new Tokenizer('word_a word_b 127.0.0.1:5525');
      var tok = tokenizer.next();
      assert.equal('word', tok.type);
      assert.equal('word_a', tok.value);

      tok = tokenizer.next();
      assert.equal('word', tok.type);
      assert.equal('word_b', tok.value);

      tok = tokenizer.next();
      assert.equal('word', tok.type);
      assert.equal('127.0.0.1:5525', tok.value);
    });

    it('should skip white space rightly', function () {
      var tokenizer = new Tokenizer('  some      text      ');
      var tok = tokenizer.next();
      assert.equal('word', tok.type);
      assert.equal('some', tok.value);

      tok = tokenizer.next();
      assert.equal('word', tok.type);
      assert.equal('text', tok.value);
    });

    it('should get `line_terminal` token rightly', function () {
      var tokenizer = new Tokenizer('\r\nsome_thing');
      var tok = tokenizer.next();
      var tok1 = tokenizer.next();
      assert.equal('line_terminal', tok.type);
      assert.equal('line_terminal', tok1.type);
    });

    it('should get `string` token rightly (eg: "hiproxy.org")', function () {
      // input: "string \"str\""
      var tokenizer = new Tokenizer('"string \\"str\\""');
      var tok = tokenizer.next();

      assert.equal('string', tok.type);
      assert.equal('string "str"', tok.value);
    });

    it('should get `string` token rightly (eg: \'hiproxy.org\')', function () {
      // input: 'string \'str\''
      var tokenizer = new Tokenizer('\'string \\\'str\\\'\'');
      var tok = tokenizer.next();

      assert.equal('string', tok.type);
      assert.equal('string \'str\'', tok.value);
    });

    it('should throw error when use different quote', function () {
      var tokenizer = new Tokenizer('"abc\'');
      tokenizer.next();
      assert.notEqual(lastMessage.indexOf('Unterminated string constant'), -1);
    });

    it('should throw error when get unterminated string', function () {
      var tokenizer = new Tokenizer('"abc\n');
      tokenizer.next();
      assert.notEqual(lastMessage.indexOf('Unterminated string constant'), -1);
    });

    it('should get `express_end` token rightly', function () {
      var tokenizer = new Tokenizer('word;');
      var tok = tokenizer.next();

      tok = tokenizer.next();
      assert.equal('express_end', tok.type);
    });

    it('should get `arrow` token rightly', function () {
      var tokenizer = new Tokenizer('http://api.hiproxy.org/ => http://hiproxy.org/api/');
      var tok = tokenizer.next(); // word: http://api.hiproxy.org/

      tok = tokenizer.next();
      assert.equal('arrow', tok.type);
    });

    it('should NOT get `arrow` token when the next CHAR after `=` is not `>`', function () {
      var tokenizer = new Tokenizer('=');
      var tok = tokenizer.next();

      assert.notEqual('arrow', tok.type);
    });

    it('should get `block_start` and `block_end` token rightly', function () {
      var tokenizer = new Tokenizer('some_word { some_thing }');
      var tok = tokenizer.next(); // word: some_word

      tok = tokenizer.next();
      assert.equal('block_start', tok.type);

      tok = tokenizer.next();

      tok = tokenizer.next();
      assert.equal('block_end', tok.type);
    });

    it('should return `null` then reach the end of input strem', function () {
      var tokenizer = new Tokenizer('some_word');
      var tok = tokenizer.next(); // word: some_word

      tok = tokenizer.next();
      assert.equal(null, tok);
    });
  });

  describe('readWhile()', function () {
    it('should read character while the condition is `true`', function () {
      var tokenizer = new Tokenizer('some_word');
      var str = tokenizer.readWhile(function (char) {
        return char.match(/[a-zA-Z]/);
      });

      assert.equal('some', str);
    });

    it('should stop read character while the condition is `false`', function () {
      var tokenizer = new Tokenizer('some_word');
      var str = tokenizer.readWhile(function (char) {
        return char !== 'm';
      });

      assert.equal('so', str);
    });

    it('should end when reach the end', function () {
      var tokenizer = new Tokenizer('some_word');
      var str = tokenizer.readWhile(function (char) {
        return true;
      });

      assert.equal('some_word', str);
    });
  });

  describe('readWhiteSpace()', function () {
    it('should read all white space character', function () {
      var tokenizer = new Tokenizer(' \u2028\u2029\u3000\tabc');
      var str = tokenizer.readWhiteSpace();

      assert.equal(' \u2028\u2029\u3000\t', str);
    });
  });

  describe('eof()', function () {
    it('should return true when reach the end', function () {
      var tokenizer = new Tokenizer('set');
      tokenizer.next();
      tokenizer.next();

      assert.equal(true, tokenizer.eof());
    });

    it('should return false when NOT reach the end', function () {
      var tokenizer = new Tokenizer('set $domain hiproxy.org');
      tokenizer.next();

      assert.equal(false, tokenizer.eof());
    });
  });
});
