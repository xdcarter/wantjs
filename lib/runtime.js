var process = {
  env: {
    NODE_ENV: 'production'
  }
}
var wantGlobal = {
  moduleList: {},
  want: function (ref) {
    return wantGlobal.moduleList[ref]
  },
  require: function (id) {
    var splitPathRe =
        /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^/]+?|)(\.[^./]*|))(?:[/]*)$/
    function splitPath (filename) {
      return splitPathRe.exec(filename).slice(1)
    }

    function filter (xs, f) {
      if (xs.filter) return xs.filter(f)
      var res = []
      for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i])
      }
      return res
    }

    function normalizeArray (parts, allowAboveRoot) {
      var up = 0
      for (var i = parts.length - 1; i >= 0; i--) {
        var last = parts[i]
        if (last === '.') {
          parts.splice(i, 1)
        } else if (last === '..') {
          parts.splice(i, 1)
          up++
        } else if (up) {
          parts.splice(i, 1)
          up--
        }
      }

      // if the path is allowed to go above the root, restore leading ..s
      if (allowAboveRoot) {
        for (; up--; up) {
          parts.unshift('..')
        }
      }

      return parts
    }

    function resolve () {
      var resolvedPath = ''
      var resolvedAbsolute = false

      for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        var path = (i >= 0) ? arguments[i] : process.cwd()

        // Skip empty and invalid entries
        if (typeof path !== 'string') {
          throw new TypeError('Arguments to path.resolve must be strings')
        } else if (!path) {
          continue
        }

        resolvedPath = path + '/' + resolvedPath
        resolvedAbsolute = path.charAt(0) === '/'
      }
      resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function (p) {
        return !!p
      }), !resolvedAbsolute).join('/')

      return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.'
    }

    function dirname (path) {
      var result = splitPath(path)
      var root = result[0]
      var dir = result[1]

      if (!root && !dir) {
        // No dirname whatsoever
        return '.'
      }

      if (dir) {
        dir = dir.substr(0, dir.length - 1)
      }
      return root + dir
    }

    return function (ref) {
      function applyPostfix (refParam) {
        var newRef
        if (refParam.endsWith('/')) {
          newRef = refParam + 'index.js'
        } else if (refParam.endsWith('.js')) {

        } else {
          newRef = refParam + '.js'
        }
        return newRef
      }
      var key
      if (ref.startsWith('.')) {
        var newRef = applyPostfix(ref)
        key = resolve(dirname(id), newRef)
      } else if (ref.startsWith('/')) {
      } else if (ref.indexOf('/') !== -1) {
        key = applyPostfix('/node_modules/' + ref)
      } else {
        key = applyPostfix('/node_modules/' + ref + '/')
        if (!wantGlobal.moduleList[key]) {
          key = key.replace('index.js', ref + '.js')
        }
        wantGlobal.moduleList[ref] = wantGlobal.moduleList[key].exports
      }
      var module = wantGlobal.moduleList[key]
      if (module) {
        return module.exports
      } else {
        console.log(id + ' : ' + ref)
      }
    }
  }
}
