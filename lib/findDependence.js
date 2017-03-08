var babel = require('babel-core')
var path = require('path')
var fs = require('fs')
var util = require('util')
var old = require.extensions['.js']
var pathList = []
var _jsxList
var _mainJSDir
var _baseDir
var findDependensPath

require.extensions['.js'] = function (m, filename) {
  old(m, filename)
  if (filename.indexOf('node_modules/babel') === -1) {
    console.debug('found js dependence:' + filename)
    addPath(filename)
  }
}

require.extensions['.jsx'] = function (m, filename) {
  if (fs.existsSync(filename)) {
    var code = babel.transformFileSync(filename, {
      babelrc: false,
      ast: false,
      presets: ['react']
    }
    ).code
    var jsxPath = filename.replace(path.join(_mainJSDir, _baseDir), '')
    console.debug(util.format('jsx key: %s', jsxPath))
    _jsxList[jsxPath] = code
    m._compile(code, filename)
  } else {
    console.log('file not exist:' + filename)
  }
}

function addPath (item) {
  if (item !== findDependensPath)pathList.push(item)
}

function deleteModule (moduleName) {
  var solvedName = require.resolve(moduleName)
  var nodeModule = require.cache[solvedName]
  if (nodeModule) {
    for (var i = 0; i < nodeModule.children.length; i++) {
      var child = nodeModule.children[i]
      deleteModule(child.filename)
    }
    delete require.cache[solvedName]
  }
}

module.exports = function (jsxList, mainJSDir, baseDir) {
  _jsxList = jsxList
  _mainJSDir = mainJSDir
  _baseDir = baseDir
  return function findDependens (jsEntryPath, clearCache) {
    console.debug(util.format('current taotal:%s', pathList.length))
    pathList = []
    if (clearCache) {
      console.debug('bengin to clear cache:' + '.' + jsEntryPath)
      deleteModule(jsEntryPath)
    }
    findDependensPath = module.filename
    try {
      console.debug(util.format('begin to calculator dependences for: %s', jsEntryPath))
      require(jsEntryPath)
    } catch (err) {
      console.debug('find dp err:' + err)
      pathList.forEach(item => {
        console.debug('clear cache js file:' + item)
        delete require.cache[item]
      })
      throw err
    }

    addPath(jsEntryPath)

    return pathList
  }
}
