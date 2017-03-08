console.debug = () => {}
var timestamp = Date.parse(new Date())
var fileVersionList = {}
var path = require('path')
var util = require('util')
var mainJsPath = require.main.filename
var mainJSDir
console.debug(util.format('mainJSpath: %s', mainJsPath))
if (mainJsPath.endsWith('node_modules/wantjs/bin/wantjs')) {
  mainJSDir = mainJsPath.replace('node_modules/wantjs/bin/wantjs', '')
} else if (mainJsPath.endsWith('node_modules/mocha/bin/_mocha')) {
  mainJSDir = mainJsPath.replace('node_modules/mocha/bin/_mocha', '')
} else {
  mainJSDir = path.dirname(mainJsPath)
}
console.debug(util.format('mainAppDir: %s', mainJSDir))
var babel = require('babel-core')
babel.transform('var a=1;')
var parseUrl = require('parseurl')
var send = require('send')
var mime = require('mime')
var fs = require('fs')
var watch = require('./watcher')

var jsxList = {}
var findDependence
var htmlEntryList = []
var jsEntryList = []
var dependenceListByJs = {}
var dependenceListByHtml = {}
var wantConfig

var htmlJsEntryMap = {}
var jsHtmlEntryMap = {}
var ready = false
function updatedependences (clearCache, filename) {
  try {
    dependenceListByJs = {}
    dependenceListByHtml = {}
    jsEntryList.forEach(jsEntryItem => {
      var entryJsPath = path.join(mainJSDir, wantConfig.baseDir, jsEntryItem)
      console.debug('call find dependences for js entry:%s', entryJsPath)
      var dependenceList = findDependence(entryJsPath, clearCache)
      console.debug('total dependences : ', dependenceList.length)
      dependenceListByJs[jsEntryItem] = dependenceList
      dependenceListByHtml[jsHtmlEntryMap[jsEntryItem]] = dependenceList
    })
    ready = true
    console.debug(filename)
    console.debug(fileVersionList[filename])
    fileVersionList[filename] = fileVersionList[filename] && ++fileVersionList[filename]
    updateFileVersionList()
  } catch (err) {
    console.error(err)
    ready = false
  }
}

function updateFileVersionList () {
  for (var item in dependenceListByJs) {
    dependenceListByJs[item].forEach(item => {
      fileVersionList[item] = fileVersionList[item] || 1
      console.debug(item)
      console.debug(fileVersionList[item])
    })
  }
}

function initWantConfig (config) {
  var configJson = {entryList: {'/': '/index.jsx'}, baseDir: '.'}
  try {
    configJson = JSON.parse(fs.readFileSync('./want.json', 'utf8'))
  } catch (e) {
    console.info('no want.json')
  }
  wantConfig = config || configJson
  if (wantConfig.baseDir === '/') {
    wantConfig.baseDir = '.'
  }
  console.debug(util.format('use wantJs config:', wantConfig))
  Object.keys(wantConfig.entryList).map(item => [item, wantConfig.entryList[item]])
      .forEach(([key, value]) => {
        htmlEntryList.push(key)
        jsEntryList.push(value)
        htmlJsEntryMap[key] = value
        jsHtmlEntryMap[value] = key
      })
  // init findDependence
  findDependence = require('./findDependence')(jsxList, mainJSDir, wantConfig.baseDir)
  // init watcher
  var watchDir = path.join(mainJSDir, wantConfig.baseDir)
  watch(watchDir, updatedependences)
  // start calculate dependence
  updatedependences()
  console.info('finish loading')
}
function isJs (path) {
  var type = mime.lookup(path)
  return ['application/javascript', 'text/jsx'].indexOf(type) !== -1
}

function isEntryHtml (path) {
  return htmlEntryList.indexOf(path) !== -1
}
function isEntryJs (path) {
  console.debug(jsEntryList)
  console.debug(path)
  return jsEntryList.indexOf(path) !== -1
}
function handle (req, res, next) {
  let urlPath = parseUrl(req).pathname
  console.debug(util.format('request url:%s', urlPath))
  if (isJs(urlPath)) {
    handleJs(urlPath)
  } else if (isEntryHtml(urlPath)) {
    handleHtmlEntry(urlPath)
  } else {
    send(req, urlPath, {root: path.join(mainJSDir, wantConfig.baseDir)})
        .pipe(res)
  }

  function handleJs (urlPath) {
    var targethtmlPath = path.join(mainJSDir, wantConfig.baseDir, urlPath)
    res.setHeader('Content-Type', 'application/javascript')
    res.setHeader('Cache-Control', 'max-age=36000')
    console.debug('check rumtime js:' + urlPath === '/node_modules/wantjs/lib/runtime.js')
    if (urlPath === '/node_modules/wantjs/lib/runtime.js') {
      console.debug('handle rumtime js')
      fs.createReadStream(targethtmlPath).pipe(res)
    } else {
      res.write('(function (id){wantGlobal.moduleList[id]={exports:{}};(function(require,module,exports){\r')
      var endWrapper = util.format('\r}).call(wantGlobal.moduleList[id].exports,wantGlobal.require(id),wantGlobal.moduleList[id],wantGlobal.moduleList[id].exports)})("%s")\r', urlPath)
      if (urlPath.endsWith('jsx')) {
        console.debug('is jsx')
        console.debug(jsxList)
        var jsxSourceCode = jsxList[urlPath]
        if (jsxSourceCode) {
          console.debug('has code ')
          res.write(jsxSourceCode)
          if (isEntryJs(urlPath)) {
            console.debug('is entry')
            res.write(endWrapper)
            res.end(util.format('wantGlobal.moduleList["%s"].exports()', urlPath))
          } else {
            res.end(endWrapper)
          }
        } else {
          res.statusCode = 500
          res.end()
        }
      } else {
        fs.createReadStream(targethtmlPath)
            .on('end', function () {
              if (isEntryJs(urlPath)) {
                res.write(endWrapper)
                res.end(util.format('wantGlobal.moduleList["%s"].exports()', urlPath))
              } else {
                res.end(endWrapper)
              }
            })
            .on('error', function (err) {
              res.end(err.toString())
            })
            .pipe(res, { end: false })
      }
    }
  }

  function handleHtmlEntry (urlPath) {
    res.setHeader('Content-Type', 'text/html')
    console.debug(util.format('request html entry: %s', urlPath))
    if (ready) {
      fs.createReadStream(path.join(mainJSDir, wantConfig.baseDir, urlPath, 'index.html'))
        .on('end', function () {
          var runtimePath = path.resolve(path.dirname(module.filename), 'runtime.js').replace(mainJSDir, '')
          res.write(util.format('<script type="application/javascript" src="%s"></script>\r', runtimePath))
          var scriptList = dependenceListByHtml[urlPath]
              .map(item => {
                var scriptURL = item.replace(mainJSDir, '') + '?' + timestamp + '' + fileVersionList[item]
                console.debug(util.format('script url:%s', scriptURL))
                return util.format('<script type="application/javascript" src="%s"></script>\r', scriptURL)
              })
              .reduce((acc, val) => acc + val)
          res.end(scriptList)
        })
        .on('error', function (err) {
          res.end(err.toString())
        })
        .pipe(res, { end: false })
    } else {
      res.end('compile err please fix your js code first')
    }
  }
}

module.exports = function (config) {
  initWantConfig(config)
  return handle
}
