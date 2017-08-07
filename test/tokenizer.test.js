/**
 * test input stream
 */

'use strict';

var assert = require('assert');

var Tokenizer = require('../src/tokenizer');

describe('# Tokenizer', function () {
  describe('next()', function () {
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
      var tokenizer = new Tokenizer('\nsome_thing');
      var tok = tokenizer.next();
      assert.equal('line_terminal', tok.type);
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
});
