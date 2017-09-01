/**
 * test input stream
 */

'use strict';

var assert = require('assert');
var Parser = require('../src/parser');

var TYPE_ERR = 'statement `type` not match';
var ARGS_LENGTH_ERR = 'arguments length not match';
var ARGS_VALUE_ERR = 'arguments value not match';

describe('# Parser', function () {
  describe('read statement tokens', function () {
    it('get comment statement tokens', function () {
      testTokens(
        '# some comment text',
        ['# some comment text']
      );
    });

    it('get base rule statement tokens', function () {
      testTokens(
        'http://api.hiproxy.org/ => http://hiproxy.org/api/',
        ['http://api.hiproxy.org/', '=>', 'http://hiproxy.org/api/']
      );
    });

    it('get call statement tokens', function () {
      testTokens(
        'set $cookie "login=true;expires=20160909";',
        ['set', '$cookie', 'login=true;expires=20160909', ';']
      );
    });

    it('get domain block tokens (eg: `domain hiporxy.org {`)', function () {
      testTokens(
        'domain hiproxy.org {',
        ['domain', 'hiproxy.org', '{']
      );
    });

    it('get domain block tokens (eg: `hiproxy.org => {`)', function () {
      testTokens(
        'hiproxy.org => {',
        ['hiproxy.org', '=>', '{']
      );
    });

    it('get location block tokens', function () {
      testTokens(
        'location /doc/ {',
        ['location', '/doc/', '{']
      );
    });

    it('should stop read tokens when get `express_end` token', function () {
      testTokens(
        'set $a A; set $b B;',
        ['set', '$a', 'A', ';']
      );
    });

    it('should stop read tokens when get `line_terminal` token', function () {
      testTokens(
        'set $a A\n set $b B;',
        ['set', '$a', 'A', undefined]
      );
    });

    it('should stop read tokens when get `block_start` token', function () {
      testTokens(
        'block A { set $b B; }',
        ['block', 'A', '{']
      );
    });

    it('should stop read tokens when get `block_end` token', function () {
      testTokens(
        ' set $b B}',
        ['set', '$b', 'B', '}']
      );
    });
  });

  describe('parse CallExpression', function () {
    var lastMessage = '';

    before(function () {
      global.logger = function (message) {
        lastMessage = message;
      };
    });

    it('parse normal call expression', function () {
      var body = getBody('proxy_pass http://docs.hiproxy.org/api/;');
      var statement = body[0];

      assert.equal('CallExpression', statement.type, TYPE_ERR);
      assert.equal(1, statement.arguments.length, ARGS_LENGTH_ERR);
      assert.equal('http://docs.hiproxy.org/api/', statement.arguments[0].value, ARGS_VALUE_ERR);
    });

    it('parse VariableDeclaration', function () {
      var body = getBody('set $url http://docs.hiproxy.org/api/;');
      var statement = body[0];

      testVariableDeclaration(statement, '$url', 'http://docs.hiproxy.org/api/');
    });

    it('parse SimpleRule', function () {
      var body = getBody('http://api.hiproxy.org/ => http://hiproxy.org/api/');
      var statement = body[0];

      var left = statement.left;
      var right = statement.right;

      assert.equal('SimpleRule', statement.type);
      assert.equal('http://api.hiproxy.org/', left.value, 'simple rule left value not match');
      assert.equal('http://hiproxy.org/api/', right.value, 'simple rule right value not match');
    });

    it('parse SimpleRule Error', function () {
      getBody('http://api.hiproxy.org/ =>');

      var indexOfError = lastMessage.indexOf('Simple Rule syntax error');

      assert.notEqual(-1, indexOfError);
    });
  });

  describe('parse GlobalBlock', function () {
    // var lastMessage = '';

    // before(function () {
    //   global.logger = function (message) {
    //     lastMessage = message;
    //   };
    // });

    it('parse global block (eg: $domain => {})', function () {
      var body = getBody('$domain => {}');
      var domainBlock = body[0];

      // domain block
      assert.equal('DomainBlock', domainBlock.type);
      assert.equal('$domain', domainBlock.domain);
    });

    it('parse global block (eg: domain $domain {})', function () {
      var body = getBody('domain $domain {}');
      var domainBlock = body[0];

      // domain block
      assert.equal('DomainBlock', domainBlock.type);
      assert.equal('$domain', domainBlock.domain);
    });

    it('parse global block and other statements', function () {
      var body = getBody('set $domain hiproxy.org;\n $domain => {}\n set $url hiproxy.org/doc');
      var statement = body[0];
      var domainBlock = body[1];
      var statement1 = body[2];

      // global directives before block
      testVariableDeclaration(statement, '$domain', 'hiproxy.org');

      // domain block
      var msg = 'global domain block parse error';
      assert.equal('DomainBlock', domainBlock.type, msg);
      assert.equal('$domain', domainBlock.domain, msg);

      // global directives after block
      testVariableDeclaration(statement1, '$url', 'hiproxy.org/doc');
    });
  });

  describe('parse DomainBlock', function () {
    // var lastMessage = '';

    // before(function () {
    //   global.logger = function (message) {
    //     lastMessage = message;
    //   };
    // });

    it('parse domain block and statements (eg: $domain => { statements; })', function () {
      var body = getBody('$domain => { set $id 1234567; set $user zdying; }');
      var domainBlock = body[0];

      // domain block
      assert.equal('DomainBlock', domainBlock.type);
      assert.equal('$domain', domainBlock.domain);

      // statements in block
      var domainBody = domainBlock.body;
      assert.equal(2, domainBody.length);
      testVariableDeclaration(domainBody[0], '$id', '1234567');
      testVariableDeclaration(domainBody[1], '$user', 'zdying');
    });

    it('parse domain block statements and location (eg: $domain => { statements; })', function () {
      var body = getBody('$domain => { set $id 1234567; set $user zdying; location / {} }');
      var domainBlock = body[0];

      // domain block
      assert.equal('DomainBlock', domainBlock.type);
      assert.equal('$domain', domainBlock.domain);

      // statements in block
      var domainBody = domainBlock.body;
      assert.equal(3, domainBody.length);
      testVariableDeclaration(domainBody[0], '$id', '1234567');
      testVariableDeclaration(domainBody[1], '$user', 'zdying');

      assert.equal('LocationBlock', domainBody[2].type);
      assert.equal('/', domainBody[2].location);
    });

    it('parse domain block statements and location (eg: domain $domain { statements; })', function () {
      var body = getBody('domain $domain { set $id 1234567; set $user zdying; location / {} }');
      var domainBlock = body[0];

      // domain block
      assert.equal('DomainBlock', domainBlock.type);
      assert.equal('$domain', domainBlock.domain);

      // statements in block
      var domainBody = domainBlock.body;
      assert.equal(3, domainBody.length);
      testVariableDeclaration(domainBody[0], '$id', '1234567');
      testVariableDeclaration(domainBody[1], '$user', 'zdying');

      assert.equal('LocationBlock', domainBody[2].type);
      assert.equal('/', domainBody[2].location);
    });
  });

  describe('parse Location', function () {
    // var lastMessage = '';

    // before(function () {
    //   global.logger = function (message) {
    //     lastMessage = message;
    //   };
    // });

    it('parse location value', function () {
      var body = getBody('domain hiproxy.org { location / { set $id 1234567; set $user zdying; } }');
      var locationBlock = body[0].body[0];

      // domain block
      assert.equal('LocationBlock', locationBlock.type);
      assert.equal('/', locationBlock.location);
    });

    it('parse location body', function () {
      var body = getBody('domain hiproxy.org { location / { set $id 1234567; set $user zdying; } }');
      var locationBlock = body[0].body[0];

      // statements in block
      var locationBody = locationBlock.body;
      assert.equal(2, locationBody.length);
      testVariableDeclaration(locationBody[0], '$id', '1234567');
      testVariableDeclaration(locationBody[1], '$user', 'zdying');
    });

    it('parse multiple location', function () {
      var body = getBody('domain hiproxy.org { location / { set $id 1234567; set $user zdying; } location /api/ { set $id 45678; } }');
      var locationBlock = body[0].body[0];

      // statements in block
      var locationBody = locationBlock.body;
      assert.equal(2, locationBody.length);
      testVariableDeclaration(locationBody[0], '$id', '1234567');
      testVariableDeclaration(locationBody[1], '$user', 'zdying');

      var locationBlock1 = body[0].body[1];
      var locationBody1 = locationBlock1.body;
      assert.equal(1, locationBody1.length);
      testVariableDeclaration(locationBody1[0], '$id', '45678');
    });

    it('parse string location', function () {
      var body = getBody('domain hiproxy.org { location /a/b/c { } }');
      var locationBlock = body[0].body[0];

      assert.equal('/a/b/c', locationBlock.location);
    });

    it('parse regexp location (eg: //(ucenter|api)//', function () {
      var body = getBody('domain hiproxy.org { location ~ //(ucenter|api)// { } }');
      var locationBlock = body[0].body[0];

      assert.equal('[object RegExp]', ({}).toString.call(locationBlock.location));
      assert.equal('\\/(ucenter|api)\\/', locationBlock.location.source);
    });

    it('parse regexp location (eg: /(ucenter|api)/', function () {
      var body = getBody('domain hiproxy.org { location ~ /(ucenter|api)/ { } }');
      var locationBlock = body[0].body[0];

      assert.equal('[object RegExp]', ({}).toString.call(locationBlock.location));
      assert.equal('\\/(ucenter|api)\\/', locationBlock.location.source);
    });
  });

  describe('block check', function () {
    var lastMessage = '';

    before(function () {
      global.logger = function (message) {
        lastMessage = message;
      };
    });

    it('domain block should be wrapped in global block', function () {
      getBody('domain hiproxy.org { domain hiproxy.org { } }');

      assert.notEqual(-1, lastMessage.indexOf('DomainBlock should be wrapped in GlobalBlock'));
    });

    it('location block should be wrapped in domain block', function () {
      getBody('location / {}');

      assert.notEqual(-1, lastMessage.indexOf('LocationBlock should be wrapped in DomainBlock'));
    });

    it('location should has a `location` value', function () {
      getBody('domain hiproxy.org {\n  location {}\n}');
      assert.notEqual(-1, lastMessage.indexOf('Unexpected LocationBlock declaration'));
    });

    it('domain should has a `domain` value', function () {
      getBody('domain {\n}');
      assert.notEqual(-1, lastMessage.indexOf('Unexpected DomainBlock declaration'));
    });

    it('domain should has a `domain` value', function () {
      getBody('hiproxy.org {\n}');
      assert.notEqual(-1, lastMessage.indexOf('Unexpected DomainBlock declaration'));
    });
  });
});

function getBody (source, block) {
  var parser = new Parser(source);
  var tree = parser.parseToplevel(block);

  return tree.body;
}

function testTokens (source, except) {
  var parser = new Parser(source);
  var tokens = parser.readStatementTokens();

  assert.equal(tokens.length, except.length, 'tokens length does not match');

  except.forEach(function (res, index) {
    assert.equal(res, tokens[index].value, 'token value does not match');
  });
}

function testVariableDeclaration (statement, id, value) {
  var sId = statement.declaration.id.value;
  var sVal = statement.declaration.value.map(function (v) {
    return v.value;
  });

  if (sVal.length === 1) {
    sVal = sVal[0];
  }

  assert.equal(sId, id, 'VariableDeclaration id not match');
  assert.deepEqual(sVal, value, 'VariableDeclaration id not match');
}
