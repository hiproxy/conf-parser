/**
 * test input stream
 */

'use strict';

var assert = require('assert');
var Parser = require('../src/parser');

describe('# Parser', function () {
  describe('parse CallExpression', function () {
    // var lastMessage = '';

    // before(function () {
    //   global.logger = function (message) {
    //     lastMessage = message;
    //   };
    // });

    it('parse normal call expression', function () {
      var body = getBody('proxy_pass http://docs.hiproxy.org/api/;');
      var statement = body[0];

      assert.equal('CallExpression', statement.type);
      assert.equal(1, statement.arguments.length);
      assert.deepEqual('http://docs.hiproxy.org/api/', statement.arguments[0].value);
    });
  });
});

function getBody (source) {
  var parser = new Parser(source);
  var tree = parser.parseToplevel();

  return tree.body;
}
