var http = require('http');

var router = require('./router');

http.createServer(router.app).listen(3000);