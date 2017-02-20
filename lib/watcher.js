var fs = require('fs');

module.exports=function(baseDir,updateDependencesHandle){
    var watcher = fs.watch('.'+baseDir,{recursive:true});
    watcher.on('change', function name(event, filename) {
        if(filename.endsWith('js') || filename.endsWith('jsx')){
            console.info("change file:"+filename)
            updateDependencesHandle(clearCache=true)
        }
    });
}