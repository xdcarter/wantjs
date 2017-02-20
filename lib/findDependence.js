var babel = require("babel-core");
var fs=require('fs')
var old=require.extensions['.js'];
var pathList=[]
var _jsxList
var findDependensPath
require.extensions['.js']=function(m, filename){


    old(m,filename)
    if(!filename.startsWith(__dirname+'/node_modules/babel')){
        console.debug('require js file:'+filename)
        addPath(filename)
    }

}
require.extensions['.jsx'] = function (m, filename) {
    if(fs.existsSync(filename)){
        var code=babel.transformFileSync(filename, {
                babelrc: false,
                ast: false,
                presets: ["react"]
            }
        ).code
        _jsxList[filename.replace(__dirname,'')]=code;
        m._compile(code,filename)
    }else{
        console.log("file not exist:"+filename)
    }

};

function addPath(item){
    if(item!==findDependensPath )pathList.push(item)
}

function deleteModule(moduleName) {
    var solvedName = require.resolve(moduleName),
        nodeModule = require.cache[solvedName];
    if (nodeModule) {
        for (var i = 0; i < nodeModule.children.length; i++) {
            var child = nodeModule.children[i];
            deleteModule(child.filename);
        }
        delete require.cache[solvedName];
    }
}


module.exports=function(jsxList){
    _jsxList=jsxList
    return function findDependens(entryName,clearCache){


        if(clearCache){
            console.debug('bengin to clear cache:'+'.'+entryName)
            deleteModule('.'+entryName)
        }


        findDependensPath=module.filename;

        try{
            var a=require('.'+entryName)
        }catch (err){
            console.debug('find dp err:'+err)
            pathList.forEach(item=>{
                console.debug('clear cache js file:'+item)

                delete require.cache[item];
            })
            throw err
        }

        addPath(__dirname+entryName)

        return pathList
    }
}


