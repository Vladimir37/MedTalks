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
app.get('/', pages.list({type: 7, page: 0}));
//Регистрация
app.get('/registration', render.route_jade('registration'));
//Авторизация
app.get('/login', render.route_jade('login'));
//Список хабов с тегами
app.get('/hubs', pages.hubs);
//Напомнить пароль
app.get('/pass', render.route_jade('pass_remind'));
//Изменить пароль
app.get('/pass_change', status(0), render.route_jade('pass_change'));
//Просмотр статьи
app.get('/article/:name', pages.article);
//Просмотр последнего в хабе
app.get('/hub/:name', pages.list({type: 1, page: 0}));
app.get('/hub/:name/:num', pages.list({type: 1, page: req.params.num}));
//Просмотр статей за авторством
app.get('/author/:name', pages.list({type: 2, page: 0}));
app.get('/author/:name/:num', pages.list({type: 2, page: req.params.num}));
//Просмотр статей по тегу
app.get('/tag/:name', pages.list({type: 3, page: 0}));
app.get('/tag/:name/:num', pages.list({type: 3, page: page_num}));
//Просмотр всего черновика
app.get('/draft', status(0), pages.list({type: 4, page: 0}));
//Просмотр статьи в черновике
app.get('/draft/:name', status(0), pages.draft_article);
//Просмотр песочницы для админов
app.get('/sandbox', status(3), pages.list({type: 5, page: 0}));
app.get('/sandbox/:num', status(3), pages.list({type: 5, page: req.params.num}));
//Личная лента юзера
app.get('/roll', status(0), pages.list({type: 6, page: 0}));
app.get('/roll/:num', status(0), pages.list({type: 6, page: req.params.num}));
//Лента всех статей
app.get('/page/:num', pages.list({type: 7, page: req.params.num}));
//Статья в песочнице
app.get('/sandbox_item/:name', status(3), pages.sandbox);
//Профиль юзера
app.get('/user/:name', pages.user);
//Свой профиль
app.get('/profile', status(0), render.route_jade('profile', req.user));
//Создание ----------------------------
//Создание статьи
app.get('/create_article', status(0), pages.create_article);
//Создание хаба
app.get('/create_hub', status(4), render.route_jade('create_hub'));
//Выход
app.get('/exit', control.exit);

//POST-запросы ---------------------------------------------

//Регистрация
app.post('/registration', control.registration);
//Авторизация
app.post('/login', control.auth);
//Создание хаба
app.post('/create_hub', status(4), control.hub);
//Создание статьи
app.post('/create_article', status(0), control.create_article);
//Операции с черновой статьёй
app.post('/draft/:name', status(0), control.draft);
//Отправка комментария
app.post('/comment/:name', status(0), control.comment);
//Редактирование профиля
app.post('/profile', status(0), control.profile);
//Изменение рейтинга
app.post('/rating/:type/:num', status(0), control.rating);
//Операции со статьями в песочнице
app.post('/sandbox_item/:name', status(3), control.sandbox);
//Операции с тегами в hubs
app.post('/hubs', status(3), control.hubs);
//Операции с паролем
app.post('/pass', control.pass);
//Поиск
app.post('/search', pages.search);
//Подписки -----------------------------------
//Подписка и отписка на юзера
app.post('/user/:name', status(0), control.subscribe(1));
//Подписка и отписка на тег
app.post('/tag/:name', status(0), control.subscribe(2));
//Подписка и отписка на хаб
app.post('/hub/:name', status(0), control.subscribe(3));
//Бан
app.post('/ban/:name', status(3), control.ban);
//Отправка статьи на переработку
app.post('/article/:name', status(3), control.recicle);
//Повышение до админа и обратно
app.post('/raise/:name', status(4), control.raise);
//AJAX проверка имени и почты
app.post('/check', checking.ajax);

//Служебные ---------------------------------------------

//Подтверждение регистрации
app.get('/confirm/:key', control.confirm);
//Ресурсы
app.get('/source/*', render.source);

//Ошибка 404
app.get('*', render.route_error);

exports.app = app;