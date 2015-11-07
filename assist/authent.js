var Redis = require('redis');
var Crypt = require('easy-encryption');

var db = require('./database');
var config = require('./../configs/app_config');

//Создание Redis-клиента
var redis = Redis.createClient();

//Параметры шифрования
var crypt_auth = new Crypt({
	secret: config.auth_key, 
	iterations: 3700
});

//Проверка авторизации и статус
function authentication(req) {
	return new Promise(function(resolve, reject) {
		if(req.cookies.mt_login) {
			var cookie_key = crypt_auth.decrypt(req.cookies.mt_login);
			redis.get(cookie_key, function(err, status) {
				if(err || !status) {
					reject('Not auth');
				}
				else {
					db.tables.users.findOne({where: {name: cookie_key}}).then(function(user) {
						if(user) {
							db.tables.profiles.findOne({where: {id: user.id}}).then(function(profile) {
								user.profile = profile;
								resolve(user);
							}, function(err) {
								reject('Not auth');
							})
						}
						else {
							reject('Not auth');
						}
					}, function(err) {
						reject('Not auth');
					})
				}
			});
		}
		else {
			reject('Not auth');
		}
	});
};

module.exports = authentication;