var express = require('express');
var parser = require('body-parser');
var cookie = require('cookie-parser');

var render = require('./render');
var control = require('./control');
var authent = require('./assist/authent');

var app = express();
app.use(parser());
app.use(cookie());

//GET-запросы

//Главная ---------------------------------------------
app.get('/', function(req, res) {
	authent(req).then(function(status) {
		res.end(status);
	}, function(err) {
		res.end('Not autorized');
	});
});
//Регистрация
app.get('/registration', function(req, res) {
	render.jade(res, 'registration');
});
//Авторизация
app.get('/login', function(req, res) {
	render.jade(res, 'login');
});
//Создание статьи
app.get('/create_article', function(req, res) {
	authent(req).then(function(status) {
		render.jade(res, 'create_article');
	}, function(err) {
		render.error(res);
	});
});
//Создание хаба
app.get('/create_hub', function(req, res) {
	authent(req).then(function(status) {
		if(status == 4) {
			render.jade(res, 'create_hub');
		}
		else {
			render.error(res);
		}
	}, function(err) {
		render.error(res);
	});
});

//POST-запросы ---------------------------------------------

//Регистрация
app.post('/registration', function(req, res) {
	control.registration(req, res);
});
//Авторизация
app.post('/login', function(req, res) {
	control.auth(req, res);
})
//Создание хаба
app.post('/create_hub', function(req, res) {
	authent(req).then(function(status) {
		if(status == 4) {
			control.hub(req, res);
		}
		else {
			render.error(res);
		}
	}, function(err) {
		render.error(res);
	});
});

//Служебные ---------------------------------------------

//Подтверждение регистрации
app.get('/confirm/:key', function(req, res) {
	control.confirm(res, req.params.key);
});
//Ресурсы
app.get('/source/*', function(req, res) {
	render.source(res, req.url);
});

//Ошибка 404
app.get('*', function(req, res) {
	render.error(res);
});

exports.app = app;