var express = require('express');
var parser = require('body-parser');

var render = require('./render');
var control = require('./control');

var app = express();
app.use(parser());

//GET-запросы

//Главная
app.get('/', function(req, res) {
	res.end('Simple');
});
//Регистрация
app.get('/registration', function(req, res) {
	res.end('<form method="post"><input type="text" name="login" placeholder="login" required><br><input type="password" name="pass" placeholder="pass" required><br><input type="text" name="mail" placeholder="mail" required><br><input type="submit" value="Submit"></form>')
});
//Подтверждение регистрации
app.get('/confirm/:key', function(req, res) {
	control.confirm(res, req.params.key);
});

//POST-запросы

//Регистрация
app.post('/registration', function(req, res) {
	control.registration(req, res);
});

exports.app = app;