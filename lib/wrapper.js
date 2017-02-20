var parseUrl = require('parseurl')
var send = require('send')
var mime = require('mime')
var util=require('util')
var fs = require('fs');
var watch=require('./watcher')

var jsxList={}
var findDependence=require('./findDependence')(jsxList)
var htmlEntryList=[]
var jsEntryList=[]
var dependenceListByJs={}
var dependenceListByHtml={}
var wantConfig;

var htmlJsEntryMap={}
var jsHtmlEntryMap={}
var ready=false;


function updatedependences(clearCache){

    try{
        dependenceListByJs={}
        dependenceListByHtml={}
        jsEntryList.forEach(jsItem=>{
            console.debug('find dependences for js entry:%s',jsItem)
            var dependenceList=findDependence(jsItem,clearCache)
            dependenceListByJs[jsItem]=dependenceList
            dependenceListByHtml[jsHtmlEntryMap[jsItem]]=dependenceList
        })
        ready=true
        console.debug('total dependences : ',dependenceListByHtml['/'].length)
    }catch (err){
        console.error(err);
        ready=false;
    }


}

function initWantConfig(){
    var configJson=fs.readFileSync('./want.json', 'utf8');
    wantConfig =  JSON.parse(configJson)||{entryList:{}};

    Object.keys(wantConfig.entryList).map(item=>[item,wantConfig.entryList[item]])
                                     .forEach(([key,value])=>{
                                         htmlEntryList.push(key);
                                         jsEntryList.push(value)
                                         htmlJsEntryMap[key]=value
                                         jsHtmlEntryMap[value]=key
                                     })
    updatedependences()
    watch(wantConfig.baseDir,updatedependences)
    console.info('finish loading')
}
function needToWrap(path){
    var type=mime.lookup(path)
    return ['application/javascript','text/jsx'].indexOf(type) !== -1 && path !== '/path.js'
}

function isEntryHtml(path){
    var type=mime.lookup(path)
    return  htmlEntryList.indexOf(path)!==-1
}

initWantConfig()
module.exports.jsxList=jsxList;
module.exports=function(req,res,next){
    let path = parseUrl(req).pathname
    if(needToWrap(path) ) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'max-age=3600')
        res.write('(function (id){wantGlobal.moduleList[id]={exports:{}};(function(require,module,exports){\r')

        var endWrapper=util.format('\r}).call(wantGlobal.moduleList[id].exports,wantGlobal.require(id),wantGlobal.moduleList[id],wantGlobal.moduleList[id].exports)})("%s")\r',path)
         if(path.endsWith('jsx')){
            res.write(jsxList[path])

            if(jsEntryList.indexOf(path) !== -1){
                res.write(endWrapper)
                res.end(util.format('wantGlobal.moduleList["%s"].exports()',path))
            }else{
                res.end(endWrapper)
            }

        }else{
            send(req, path, { root: __dirname,autoEnd:false})
                .on('end', function(){
                    res.end(endWrapper)
                })
                .pipe(res)
        }


    }else if(isEntryHtml(path)){
        res.setHeader('Content-Type', 'text/html');
        console.log(ready)
        if(ready){

            res.write(' ')

            send(req, path, { root: __dirname,autoEnd:false})
                .on('end', function(){
                    var scriptList=dependenceListByHtml[path]
                        .map(item=>util.format('<script type="application/javascript" src="%s"></script>\r',item.replace(__dirname,'')))
                        .reduce((acc, val)=>acc+val)
                    res.end(scriptList)

                })
                .pipe(res)
        }else{
            res.end('compile err please fix your js code first')
        }

    }else{
        send(req, path, { root: __dirname})
            .pipe(res)
    }

}