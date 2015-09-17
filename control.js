var Crypt = require('easy-encryption');
var random = require('random-token').create('0987654321');

var db = require('./database');
var config = require('./configs/app_config');
var checking = require('./checking');

//Параметры шифрования
var crypt = new Crypt({
	secret: config.encrypt_key, 
	iterations: 3700
});

//Регистрация
function registration(req, res) {
	checking.fullCheck(req.body.login, req.body.mail, req.body.pass).then(function() {
		//Дальнейшая регистрация
		db.tables.users.create({
			name: req.body.login,
			pass: crypt.encrypt(req.body.pass),
			mail: req.body.mail,
			key: random(12)
		}).then(function() {
			//Отправка письма с подтверждением
			res.end('WIN');
		}, function(err) {
			//Ошибка базы
			console.log(err);
			res.end('FAIL');
		});
	}, function(err) {
		//Ошибка: не все поля заполнены верно
		console.log(err);
		res.redirect('/registration#error');
	});
};

exports.registration = registration;