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

//Проверка авторизации при загрузке
app.use(function (req, res, next) {
	authent(req).then(function (user){
		req.user = user;
		next();
	}, function() {
		next();
	});
});

//GET-запросы

//Главная ---------------------------------------------
app.get('/', function(req, res) {
	console.log(req.user);
	res.end('END');
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
//Просмотр последнего в хабе
app.get('/hub/:name', function(req, res) {
	pages.list(req, res, {type: 1, page: 0});
});
app.get('/hub/:name/:num', function(req, res) {
	var page_num = req.params.num;
	pages.list(req, res, {type: 1, page: page_num});
});
//Просмотр статей за авторством
app.get('/author/:name', function(req, res) {
	pages.list(req, res, {type: 2, page: 0});
});
app.get('/author/:name/:num', function(req, res) {
	var page_num = req.params.num;
	pages.list(req, res, {type: 2, page: page_num});
});
//Просмотр статей по тегу
app.get('/tag/:name', function(req, res) {
	pages.list(req, res, {type: 3, page: 0});
});
app.get('/tag/:name/:num', function(req, res) {
	var page_num = req.params.num;
	pages.list(req, res, {type: 3, page: page_num});
});
//Просмотр всего черновика
app.get('/draft', function(req, res) {
	if(req.user) {
		pages.list(req, res, {type: 4, page: 0});
	}
	else {
		render.error(res);
	}
});
//Просмотр статьи в черновике
app.get('/draft/:name', function(req, res) {
	if(req.user) {
		pages.draft_article(req, res);
	}
	else {
		render.error(res);
	}
});
//Профиль юзера
app.get('/user/:name', function(req, res) {
	pages.user(req, res);
});
//Свой профиль
app.get('/profile', function(req, res) {
	if(req.user) {
		pages.profile(req, res);
	}
	else {
		render.error(res);
	}
});
//Создание ----------------------------
//Создание статьи
app.get('/create_article', function(req, res) {
	if(req.user) {
		pages.create_article(res);
	}
	else {
		render.error(res);
	}
});
//Создание хаба
app.get('/create_hub', function(req, res) {
	if(req.user && req.user.status == 4) {
		render.jade(res, 'create_hub');
	}
	else {
		render.error(res);
	}
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
	if(req.user && req.user.status == 4) {
		control.hub(req, res);
	}
	else {
		render.error(res);
	}
});
//Создание статьи
app.post('/create_article', function(req, res) {
	if(req.user) {
		control.create_article(req, res);
	}
	else {
		render.error(res);
	}
});
//Операции с черновой статьёй
app.post('/draft/:name', function(req, res) {
	if(req.user) {
		//ПЕРЕДЕЛАТЬ
		control.draft(req, res, req.user.id);
	}
	else {
		render.error(res);
	}
});
//Отправка комментария
app.post('/comment/:name', function(req, res) {
	if(req.user) {
		control.comment(req, res);
	}
	else {
		render.error(res);
	}
});
//Редактирование профиля
app.post('/profile', function(req, res) {
	if(req.user) {
		control.profile(req, res);
	}
	else {
		render.error(res);
	}
});
//Подписки -----------------------------------
//Подписка и отписка на юзера
app.post('/user/:name', function(req, res) {
	if(req.user) {
		control.subscribe(req, res, 1);
	}
	else {
		render.error(res);
	}
});
//Подписка и отписка на тег
app.post('/tag/:name', function(req, res) {
	if(req.user) {
		control.subscribe(req, res, 2);
	}
	else {
		render.error(res);
	}
});
//Подписка и отписка на хаб
app.post('/hub/:name', function(req, res) {
	if(req.user) {
		control.subscribe(req, res, 3);
	}
	else {
		render.error(res);
	}
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