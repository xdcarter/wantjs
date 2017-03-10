var old=require.extensions['.js']
require.extensions['.js'] = function (m, filename) {
  old(m, filename)
  console.log(filename)

}

require('./node_modules/wantjs/thirdPart/jsx-transpiler/lib')
