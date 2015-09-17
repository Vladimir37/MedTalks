var db = require('./database');

//Регулярные выражения
var re_name = new RegExp('^[a-zA-Z0-9_]+$');
var re_mail = new RegExp('.+@.+\..+');

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

exports.fullCheck = all_check;