var Crypt = require('easy-encryption');
var random = require('random-token').create('0987654321');

var db = require('./assist/database');
var config = require('./configs/app_config');
var checking = require('./assist/checking');
var mail = require('./assist/mail').send;

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

exports.registration = registration;
exports.confirm = confirm;