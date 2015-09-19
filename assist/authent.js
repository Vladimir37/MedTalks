var Redis = require('redis');
var Crypt = require('easy-encryption');

var config = require('./../configs/app_config');

//Создание Redis-клиента
var redis = Redis.createClient();

//Параметры шифрования
var crypt_auth = new Crypt({
	secret: config.auth_key, 
	iterations: 3700
});

//Проверка авторизации и статус
function authentication(req, res) {
	return new Promise(function(resolve, reject) {
		if(req.cookies.mt_login) {
			var cookie_key = crypt_auth.decrypt(req.cookies.mt_login);
			redis.get(cookie_key, function(err, result) {
				if(err || !result) {
					reject('Not auth');
				}
				else {
					resolve(result);
				}
			});
		}
		else {
			reject('Not auth');
		}
	});
};

module.exports = authentication;