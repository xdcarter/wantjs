WantJS (Web Runtime For CommonJS)
=================================

WantJS is Runtime environment include both (server and client) to  simplify using with CommonJS in Web. 
Our goal is to make commonJS more intuitively in Web development,package less in development phase, 
easily in package splice in production configuration less in bootstrap.

Usage
-----
Create your npm project
``` cmd
mkdir hello-world

cd hello-world

npm init -y

npm install wantjs --save-dev
```

For example, using React 
``` cmd
npm install react react-dom --save
```

Create index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<div id="root"></div>
</body>
</html>
```

Create index.jsx
```js
var ReactDom =require('react-dom')
var React =require('react')
var log=require('./app/util/log1')
module.exports=function (){
    log('start ')
    ReactDom.render(
        <h1>Hello world!</h1>,
        document.getElementById('root')
    );
}
```

Add start script in package.json
``` js
  "scripts": {
    "start": "wantjs"
  },
```

Run cmd
``` cmd
npm run start
```

server will linsten at 8300,