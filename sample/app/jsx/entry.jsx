var ReactDom =require('react-dom')
var React =require('react')
var log=require('../util/log1')
module.exports=function (){
    log('start render')
    ReactDom.render(
        <h1>Hello333333,112227 world!</h1>,
        document.getElementById('root')
    );
}


