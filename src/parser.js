/**
 * @file Parser
 * @author zdying
 */

var Tokenizer = require('./tokenizer');

function Parser (source) {
  this.tokenizer = new Tokenizer(source);
  this.context = [];
  this.enterContext('Program');
}

Parser.prototype = {
  constructor: Parser,

  enterContext: function (type) {
    var context = {
      type: type,
      body: []
    }
    this.context.push(context);

    return context;
  },

  existContext: function () {
    this.context.pop();

    return this.context[this.context.length - 1];
  },

  getContext: function () {
    return this.context[this.context.length - 1];
  },

  parseTopLevel: function () {
    var tree = {
      body: [],
      type: 'Program'
    };
    var tokenizer = this.tokenizer;
    var exp = null;
    var tok;

    while (!tokenizer.eof()) {
      exp = this.parseExpress();
      exp && tree.body.push(exp);
    }

    return tree
  },

  parse: function () {
    var tokenizer = this.tokenizer;
    var express = null;
    var tok = tokenizer.next();
    var type = tok.type;

    switch (type) {
      case 'line_terminal':
      case 'express_end':
        // return this.parseCall(type, tokens);
        return null;
        break;
      
      case 'comment':
        return null;
        break;

      case 'block_start':
        return this.parseBlock(type, tokens);
        break;

      case 'block_end':
        this.existContext();
        break;

      default: 

        break; 
    }

    while (!tokenizer.eof()) {
      express = this.parseExpress();
      express && body.push(express);
    }

    return ast;
  },

  parseExpress: function () {
    var tok = null;
    var type = '';
    var res = {};
    var tokens = [];
    var tokenizer = this.tokenizer;
    var hasArrow = false;

    while (tok = tokenizer.next()) {
      type = tok.type;

      if (
        type === 'express_end' 
        || type === 'comment' 
        || type === 'line_terminal' 
        || type === 'block_start' 
        || type === 'block_end'
      ) {
        break;
      }

      tokens.push(tok.value);

      if (type === 'arrow') {
        hasArrow = true;
      }
    }

    switch (type) {
      case 'line_terminal':
      case 'express_end':
        return tokens.length ? this.parseCall(type, tokens) : null;
        break;
      
      case 'comment':
        return null;
        break;

      case 'block_start':
        debugger
        var bllll = this.parseBlock(type, tokens);
        return bllll;
        break;

      case 'block_end':
        return null;
        break;

      default: 

        break;
    };

    return {
      type: 'Express',
      values: tokens.join(' ')
    };
  },

  parseCall (type, tokens) {
    var name = tokens.shift();
    var params = tokens;

    // base rules, for example:
    // http://api.hiproxy.org/ => http://hiproxy.org/api/
    if (tokens.indexOf('=>') > -1) {
      if (tokens.length === 3) {
        return {
          type: 'Simple Rule',
          left: name,
          right: params.pop()
        }
      } else {
        throw Error('Simple Rule syntax error');
      }
    }

    return {
      type: 'Call',
      directive: name,
      params: params
    }
  },

  parseBlock (type, tokens) {
    console.log('parse block:', type, tokens);
    // domain hiproxy.org {
    // domain => {    
    // location / {
    var blockName = tokens.shift();
    var block = null;
    var token = null;
    var exp = null;

    var a = [];
    while(!this.tokenizer.eof()){
      token = this.tokenizer.next();
      if(!token || token.type === 'block_end'){
        console.log('blockend', type, tokens);
        break;
      }

      console.log('当前token：', token);

      // exp = this.parseExpress();
      // exp && block.body.push(exp);
      a.push(token)
    }

    return {
      name: blockName,
      tokens: a
    };

    if (tokens.indexOf('=>') !== -1) {
      // tokens should ONLY has one element '=>'
      if (tokens.length === 1) {
        // this.enterContext('Domain');
        // block = this.parse('block');
        block = {
          type: 'block',
          name: 'domain',
          data: blockName,
          body: []
        };
        while(true){
          token = this.tokenizer.next();
          if(!token || token.type === 'block_end'){
            console.log('blockend', type, tokens);
            break;
          }

          console.log('当前token：', token);

          exp = this.parseExpress();
          exp && block.body.push(exp);
        }
      } else {
        throw Error('Domain syntax error:', blockName, '=>', tokens.join(' '));
      }
    } else {
      // this.enterContext(blockName);
      // block = this.parse('block');
      block = {
        type: 'Block',
        name: blockName,
        data: tokens,
        body: []
      };

      while(true){
        token = this.tokenizer.next();
        if(!token || token.type === 'block_end'){
          console.log('blockend', type, tokens);
          break;
        }

        console.log('当前token：', token);

        exp = this.parseExpress();
        exp && block.body.push(exp);
      }
    }
    console.log('block::', JSON.stringify(block, null, 2));
    return block;    
  }
};

module.exports = Parser;

// test
var file = require('path').join(__dirname, 'test.txt');
var source = require('fs').readFileSync(file, 'utf-8');
var parser = new Parser(source);

var res = parser.parseTopLevel();

// console.log(res);
console.log(JSON.stringify(res, null, 2));
