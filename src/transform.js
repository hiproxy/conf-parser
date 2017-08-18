/**
 * @file AST transform
 * @author zdying
 */

function Transform () {

}

Transform.prototype = {
  constructor: Transform,
  tranform: function (AST, result) {
    if (
      !AST ||
      AST.type !== 'Block' ||
      !Array.isArray(AST.body) ||
      AST.body.length === 0
    ) {
      return null;
    }

    var body = AST.body;

    result = result || {};

    body.forEach(function (statement) {
      var type = statement.type;

      switch (type) {
        case 'Simple Rule':
          this.transformSimpleRule(result, statement);
          break;
        case 'Call':
          this.transformCall(result, statement);
          break;
        case 'Block':
          this.transformBlcok(result, statement);
          break;
        default:

          break;
      }
    }, this);

    return result;
  },

  transformSimpleRule: function (target, statement) {
    var left = statement.left;
    var right = statement.right;
    var obj = {
      source: left.value,
      target: right.value
    };

    if (Array.isArray(target.baseRules)) {
      target.baseRules.push(obj);
    } else {
      target.baseRules = [obj];
    }
  },

  transformCall: function (target, statement) {
    var directive = statement.directive;
    var params = statement.params.map(function (param) {
      return param.value;
    });
    var obj = {
      directive: directive,
      params: params
    };

    if (Array.isArray(target.directives)) {
      target.directives.push(obj);
    } else {
      target.directives = [obj];
    }
  },

  transformBlcok: function (target, statement) {
    var name = statement.name;
    switch (name) {
      case 'Domain':
        this.transformDomain(target, statement);
        break;

      case 'Location':
        this.transformLocation(target, statement);
        break;

      default:
        break;
    }
  },

  transformDomain: function (target, statement) {
    var obj = this.tranform(statement, {
      domain: statement.domain,
      directives: [],
      locations: []
    });

    if (Array.isArray(target.domains)) {
      target.domains.push(obj);
    } else {
      target.domains = [obj];
    }
  },

  transformLocation: function (target, statement) {
    var location = statement.location;
    var obj = this.tranform(statement, {
      location: location,
      directives: []
    });

    if (Array.isArray(target.locations)) {
      target.locations.push(obj);
    } else {
      target.locations = [obj];
    }
  }
};

module.exports = Transform;

var file = require('path').join(__dirname, 'test.txt');
var source = require('fs').readFileSync(file, 'utf-8');
var Parser = require('./parser.js');
var parser = new Parser(source);
var ast = parser.parseToplevel();

var res = new Transform().tranform(ast);

console.log(JSON.stringify(res, null, 4));
