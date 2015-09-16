var express = require('express');

var render = require('./render');
var control = require('./control');

var app = express();

app.get('/', function(req, res) {
	res.end('Simple');
});

exports.app = app;