var ReactDom =require('react-dom')
var React =require('react')
var log=require('./app/util/log1')
module.exports=function (){
    log('start ')
    ReactDom.render(
        <h1>Hellosdfsdfasdfaworld!</h1>,
        document.getElementById('root')
    );
}
