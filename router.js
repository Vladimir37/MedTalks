var express = require('express');

var render = require('./render');
var control = require('./control');

var app = express();

app.get('/', function(req, res) {
	res.end('Simple WIN');
});
app.get('/te', function(req, res) {
	res.end('WIN te');
});
app.get('/do', function(req, res) {
	res.end('WIN do');
});

exports.app = app;