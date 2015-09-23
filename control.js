var Crypt = require('easy-encryption');
var random = require('random-token').create('0987654321');
var Redis = require('redis');
var formidable = require('formidable');
var mime = require('mime');

var render = require('./render');
var db = require('./assist/database');
var config = require('./configs/app_config');
var checking = require('./assist/checking');
var mail = require('./assist/mail').send;

//Создание Redis-клиента
var redis = Redis.createClient();

//Параметры шифрования
var crypt_pass = new Crypt({
	secret: config.encrypt_key, 
	iterations: 3700
});
var crypt_auth = new Crypt({
	secret: config.auth_key, 
	iterations: 3700
});

//Регистрация
function registration(req, res) {
	checking.fullCheck(req.body.login, req.body.mail, req.body.pass).then(function() {
		//Дальнейшая регистрация
		db.tables.users.create({
			name: req.body.login,
			pass: crypt_pass.encrypt(req.body.pass),
			mail: req.body.mail,
			key: random(12)
		}).then(function(result) {
			//Отправка письма с подтверждением
			var key_mail = result.key + '_' + result.id;
			mail(req.body.mail, 'Регистрация на MedTalks', 'Вы зарегистрированы. Перейдите по этой ссылке для подтверждения регистрации: <br><a href="http://localhost:3000/confirm/'+ key_mail +'">http://localhost:3000/confirm/'+ key_mail +'<a/>');
			res.redirect('/registration#success');
		}, function(err) {
			//Ошибка базы
			console.log(err);
			res.redirect('/registration#server_error');
		});
	}, function(err) {
		//Ошибка: не все поля заполнены верно
		console.log(err);
		res.redirect('/registration#error');
	});
};

//Подтверждение регистрации
function confirm(res, key) {
	checking.confirm(key).then(function(user_id) {
		db.tables.users.update({status: 1}, {where: {id: user_id}}).then(function() {
			res.redirect('/confirm#success');
		}, function(err) {
			console.log(err);
			res.redirect('/confirm#server_error');
		})
	}, function(err) {
		console.log(err);
		res.redirect('/confirm#error');
	});
};

//Авторизация
function auth(req, res) {
	var enter_login = req.body.login;
	var enter_pass = req.body.pass;
	db.tables.users.findOne({where: {mail: enter_login}}).then(function(result) {
		if(result && crypt_pass.decrypt(result.pass) == enter_pass) {
			var cookie_data = {};
			if(req.body.remember) {
				cookie_data.maxAge = 1210000000
			}
			redis.set(result.name, result.status);
			redis.expire(result.name, 1210000);
			res.cookie('mt_login', crypt_auth.encrypt(result.name), cookie_data);
			res.redirect('/');
		}
		else {
			res.redirect('/login#incorrect');
		}
	}, function(err) {
		console.log(err);
		res.redirect('/login#error');
	});
};

//Создание хаба
function createHub(req, res) {
	db.tables.hubs.create({name: req.body.name}).then(function() {
		render.jade(res, 'success/hub');
	}, function(err) {
		console.log(err);
		render.jade(res, 'errors/eServer');
	});
};

//Создание статьи
function createArticle(req, res, status) {
	if(status == 0) {
		render.jade(res, 'errors/eConfirm');
	}
	else {
		var form = new formidable.IncomingForm({encoding: 'utf-8', uploadDir: 'temp'});
		form.parse(req, function(err, fields, files) {
			//mime.extension(files.f1.type);
			//Проверка изображений по типу
			console.log(files.f1);
			for(key in files) {

			}
			res.end('END');
		})
	}
};

exports.registration = registration;
exports.confirm = confirm;
exports.auth = auth;
exports.hub = createHub;
exports.create_article = createArticle;