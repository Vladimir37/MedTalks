var http = require('http');

var router = require('./router');
var config = require('./configs/app_config');

http.createServer(router.app).listen(config.port);