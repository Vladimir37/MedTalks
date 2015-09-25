var express = require('express');
var parser = require('body-parser');
var cookie = require('cookie-parser');

var render = require('./render');
var pages = require('./assist/pages');
var control = require('./control');
var authent = require('./assist/authent');
var checking = require('./assist/checking');

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
//Просмотр статьи
app.get('/article/:name', function(req, res) {
	pages.article(req, res);
});
//Просмотр всего черновика
app.get('/draft', function(req, res) {
	authent(req).then(function(status) {
		pages.draft(req, res);
	}, function(err) {
		render.error(res);
	});
});
//Просмотр статьи в черновике
app.get('/draft/:name', function(req, res) {
	checking.user(req).then(function(user_id) {
		pages.draft_article(req, res, user_id);
	}, function(err) {
		render.error(res);
	});
});
//Создание ----------------------------
//Создание статьи
app.get('/create_article', function(req, res) {
	authent(req).then(function(status) {
		pages.create_article(res);
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
//Создание статьи
app.post('/create_article', function(req, res) {
	authent(req).then(function(status) {
		control.create_article(req, res, status);
	}, function(err) {
		render.error(res);
	});
});
//Операции с черновой статьёй
app.post('/draft/:name', function(req, res) {
	checking.user(req).then(function(user_id) {
		control.draft(req, res, req.params.name, user_id);
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