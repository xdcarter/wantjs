var parser = require('./node_modules/wantjs/thirdPart/jsx-transpiler');
var test = parser.compile(`
var log = require('./logger')
log('hello')`).code
console.log(test)
