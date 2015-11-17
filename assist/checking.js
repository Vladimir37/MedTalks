var Crypt = require('easy-encryption');

var db = require('./database');
var config = require('./../configs/app_config');

//Регулярные выражения
var re_name = new RegExp('^[a-zA-Z0-9_]+$');
var re_mail = new RegExp('.+@.+\..+');
var re_confirm = new RegExp('^[0-9]+\_[0-9]+$');
var re_file = new RegExp('^image/');

//Параметры шифрования
var crypt_auth = new Crypt({
	secret: config.auth_key, 
	iterations: 3700
});

//Проверка имени на занятость
function name_check(enter_name) {
	return new Promise(function(res, rej){
		if(re_name.test(enter_name)) {
			db.tables.users.findOne({where: {name: enter_name}}).then(function(result) {
				if(result) {
					rej('Name is exist');
				}
				else {
					res(true);
				}
			});
		}
		else {
			rej('RegExp');
		}
	});
};
//Проверка почты на занятость
function mail_check(enter_mail) {
	return new Promise(function(res, rej){
		if(re_mail.test(enter_mail)) {
			db.tables.users.findOne({where: {mail: enter_mail}}).then(function(result) {
				if(result) {
					rej('Mail is exist');
				}
				else {
					res(true);
				}
			});
		}
		else {
			rej('RegExp');
		}
	});
};

//Полная проверка
function all_check(name, mail, pass) {
	if(pass) {
		return Promise.all([name_check(name), mail_check(mail)]);
	}
	else {
		return Promise.reject('Password not exist');
	}
};

//Проверка кода подтверждения
function confirm(key) {
	return new Promise(function(res, rej) {
		if(re_confirm.test(key)) {
			var key_arr = key.split('_');
			db.tables.users.findOne({where: {id: key_arr[1], key: key_arr[0]}}).then(function(result) {
				if(result) {
					res(key_arr[1]);
				}
				else {
					rej('Key incorrect');
				}
			}, function(err) {
				rej('Server error')
			});
		}
		else {
			rej('Key incorrect');
		}
	});
};

//Проверка типа загруженного файла и его размера
function fileType(file) {
	if(re_file.test(file.type) && file.size < 5242880) {
		return true;
	}
	else {
		return false;
	}
}

//Возврат номера автора по кукам
function user_id(req) {
	return new Promise(function(resolve, reject) {
		var user_id;
		var user = crypt_auth.decrypt(req.cookies.mt_login);
		db.tables.users.findOne({where: {name: user}}).then(function(result) {
			if(result != null) {
				var user_id = result.id;
				resolve(user_id);
			}
			else {
				reject('Not authorized');
			}
		}, function(err) {
			reject('Not authorized')
		});
	});
};

//AJAX проверка имени и почты
function ajax(req, res) {
	var type = req.body.type;
	var data = req.body.data;
	if(type == 'mail') {
		mail_check(data).then(function() {
			res.end('Free');
		}, function() {
			res.end('Not free');
		});
	}
	else if(type == 'name') {
		name_check(data).then(function() {
			res.end('Free');
		}, function() {
			res.end('Not free');
		});
	}
	else {
		res.end('Not free');
	}
};

exports.fullCheck = all_check;
exports.confirm = confirm;
exports.file = fileType;
exports.user = user_id;
exports.ajax = ajax;