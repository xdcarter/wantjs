var http = require('http')
var wantjs = require('wantjs')
var server = http.createServer(wantjs())
server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(8300);