var express = require('express');
var parser = require('body-parser');
var cookie = require('cookie-parser');
var favicon = require('serve-favicon');

var render = require('./render');
var pages = require('./assist/pages');
var control = require('./control');
var authent = require('./assist/authent');
var checking = require('./assist/checking');
var status = require('./assist/status');

var app = express();
app.use(parser());
app.use(cookie());
app.use(favicon('front/source/other/favicon.ico'));

//Проверка авторизации при загрузке
app.use(function (req, res, next) {
	authent(req).then(function (user){
		req.user = user;
		res.auth = true;
		next();
	}, function() {
		next();
	});
});

//GET-запросы

//Главная ---------------------------------------------
app.get('/', function(req, res) {
	pages.list(req, res, {type: 7, page: 0});
});
//Регистрация
app.get('/registration', function(req, res) {
	render.jade(res, 'registration');
});
//Авторизация
app.get('/login', function(req, res) {
	render.jade(res, 'login');
});
//Список хабов с тегами
app.get('/hubs', function(req, res) {
	pages.hubs(req, res);
});
//Напомнить пароль
app.get('/pass', function(req, res) {
	render.jade(res, 'pass_remind');
});
//Изменить пароль
app.get('/pass_change', status(0), function(req, res) {
		render.jade(res, 'pass_change');
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
app.get('/draft/:name', status(0), pages.draft_article);
//Просмотр песочницы для админов
app.get('/sandbox', status(3), function(req, res) {
    pages.list(req, res, {type: 5, page: 0});
});
app.get('/sandbox/:num', status(3), function(req, res) {
    var page_num = req.params.num;
    pages.list(req, res, {type: 5, page: page_num});
});
//Личная лента юзера
app.get('/roll', status(0), function(req, res) {
		pages.list(req, res, {type: 6, page: 0});
});
app.get('/roll/:num', status(0), function(req, res) {
		var page_num = req.params.num;
		pages.list(req, res, {type: 6, page: page_num});
});
//Лента всех статей
app.get('/page/:num', function(req, res) {
	var page_num = req.params.num;
	pages.list(req, res, {type: 7, page: page_num});
});
//Статья в песочнице
app.get('/sandbox_item/:name', status(3), function(req, res) {
		pages.sandbox(req, res);
});
//Профиль юзера
app.get('/user/:name', function(req, res) {
	pages.user(req, res);
});
//Свой профиль
app.get('/profile', status(0), function(req, res) {
		render.jade(res, 'profile', req.user);
});
//Создание ----------------------------
//Создание статьи
app.get('/create_article', status(0), function(req, res) {
		pages.create_article(res);
});
//Создание хаба
app.get('/create_hub', status(4), function(req, res) {
		render.jade(res, 'create_hub');
});
//Выход
app.get('/exit', function(req, res) {
	control.exit(req, res);
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
app.post('/create_hub', status(4), function(req, res) {
		control.hub(req, res);
});
//Создание статьи
app.post('/create_article', status(0), function(req, res) {
		control.create_article(req, res);
});
//Операции с черновой статьёй
app.post('/draft/:name', status(0), function(req, res) {
		control.draft(req, res);
});
//Отправка комментария
app.post('/comment/:name', status(0), function(req, res) {
		control.comment(req, res);
});
//Редактирование профиля
app.post('/profile', status(0), function(req, res) {
		control.profile(req, res);
});
//Изменение рейтинга
app.post('/rating/:type/:num', status(0), function(req, res) {
		control.rating(req, res);
});
//Операции со статьями в песочнице
app.post('/sandbox_item/:name', status(3), function(req, res) {
		control.sandbox(req, res);
});
//Операции с тегами в hubs
app.post('/hubs', status(3), function(req, res) {
		control.hubs(req, res);
});
//Операции с паролем
app.post('/pass', function(req, res) {
	control.pass(req, res);
});
//Поиск
app.post('/search', function(req, res) {
	pages.search(req, res);
});
//Подписки -----------------------------------
//Подписка и отписка на юзера
app.post('/user/:name', status(0), function(req, res) {
		control.subscribe(req, res, 1);
});
//Подписка и отписка на тег
app.post('/tag/:name', status(0), function(req, res) {
		control.subscribe(req, res, 2);
});
//Подписка и отписка на хаб
app.post('/hub/:name', status(0), function(req, res) {
		control.subscribe(req, res, 3);
});
//Бан
app.post('/ban/:name', status(3), function(req, res) {
		control.ban(req, res);
});
//Отправка статьи на переработку
app.post('/article/:name', status(3), function(req, res) {
		control.recicle(req, res);
});
//Повышение до админа и обратно
app.post('/raise/:name', status(4), function(req, res) {
		control.raise(req, res);
});
//AJAX проверка имени и почты
app.post('/check', function(req, res) {
	checking.ajax(req);
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