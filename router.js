var express = require('express');

var render = require('./render');
var control = require('./control');

var app = express();

//GET-запросы

app.get('/', function(req, res) {
	res.end('Simple');
});
//Регистрация
app.get('/registration', function(req, res) {
	res.end('<form method="post"><input type="text" name="login" placeholder="login"><br><input type="password" name="pass" placeholder="pass"><br><input type="text" name="mail" placeholder="mail"><br><input type="submit" value="Submit"></form>')
});

//POST-запросы


exports.app = app;