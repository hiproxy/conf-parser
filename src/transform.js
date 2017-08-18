/**
 * @file AST transform
 * @author zdying
 */

function Transform () {

}

Transform.prototype = {
  constructor: Transform,
  tranform: function (AST, target) {
    if (
      !AST ||
      AST.type.indexOf('Block') === -1 ||
      !Array.isArray(AST.body) ||
      AST.body.length === 0
    ) {
      return null;
    }

    var body = AST.body;

    target = target || {};

    body.forEach(function (statement) {
      var type = statement.type;

      switch (type) {
        case 'SimpleRule':
          this.transformSimpleRule(target, statement);
          break;
        case 'CallExpression':
          this.transformCall(target, statement);
          break;
        case 'VariableDeclaration':
          this.transformSet(target, statement);
          break;
        case 'DomainBlock':
          this.transformDomain(target, statement);
          break;
        case 'LocationBlock':
          this.transformLocation(target, statement);
          break;
        default:

          break;
      }
    }, this);

    return target;
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
    var params = statement.arguments.map(function (param) {
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

  transformDomain: function (target, statement) {
    var domain = {
      domain: statement.domain,
      directives: [],
      locations: []
    };

    // merge props/directives from `GlobalBlock`
    this.mergeProps(domain, target);

    var obj = this.tranform(statement, domain);

    if (Array.isArray(target.domains)) {
      target.domains.push(obj);
    } else {
      target.domains = [obj];
    }
  },

  transformLocation: function (target, statement) {
    var location = {
      location: statement.location,
      directives: []
    };

    // merge props/directives from `DomainBlock`
    this.mergeProps(location, target);

    var obj = this.tranform(statement, location, target);

    if (Array.isArray(target.locations)) {
      target.locations.push(obj);
    } else {
      target.locations = [obj];
    }
  },

  transformSet: function (target, statement) {
    if (!target.variables) {
      target.variables = {};
    }

    var declaration = statement.declaration;
    var id = declaration.id.value;
    var value = declaration.value;

    if (value.length === 1) {
      value = value[0].value;
    } else {
      value = value.map(function (val) {
        return val.value;
      });
    }

    target.variables[id] = value;
  },

  mergeProps: function (current, parent) {
    ['directives', 'variables'].forEach(function (key) {
      var props = parent[key];
      var currProps = current[key];
      var prop = '';

      if (!props) {
        return;
      }

      currProps = currProps || (current[key] = {});

      if (Array.isArray(props)) {
        current[key] = props.concat(currProps);
      } else if (typeof props === 'object') {
        for (prop in props) {
          if (!(prop in currProps)) {
            currProps[prop] = props[prop];
          }
        }
      }
    });
  }
};

module.exports = Transform;

var file = require('path').join(__dirname, 'test.txt');
var source = require('fs').readFileSync(file, 'utf-8');
var Parser = require('./parser.js');
var parser = new Parser(source);
var ast = parser.parseToplevel();

var res = new Transform().tranform(ast);

console.log(JSON.stringify(res, null, 2));
