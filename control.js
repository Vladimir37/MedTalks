var Crypt = require('easy-encryption');
var random = require('random-token').create('0987654321');
var Redis = require('redis');
var formidable = require('formidable');
var fs = require('fs');
var ei = require('easyimage');

var authent = require('./assist/authent');
var render = require('./render');
var pages = require('./assist/pages');
var db = require('./assist/database');
var config = require('./configs/app_config');
var checking = require('./assist/checking');
var mail = require('./assist/mail').send;
var assist = require('./assist/assist');

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
			render.server(res);
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
		//Определение статуса по конфигу
		var user_status = 2;
		if(config.restrictions_users) {
			user_status = 1;
		}
		//Запись в базу
		db.tables.users.update({status: user_status}, {where: {id: user_id}}).then(function() {
			res.redirect('/confirm#success');
		}, function(err) {
			console.log(err);
			render.server(res);
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
			if(result.status != 0) {
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
				render.jade(res, 'errors/eConfirm');
			}
		}
		else {
			res.redirect('/login#incorrect');
		}
	}, function(err) {
		console.log(err);
		render.server(res);
		server_error
	});
};

//Создание хаба
function createHub(req, res) {
	db.tables.hubs.find({where: {addr: req.body.addr}}).then(function(result) {
		console.log(result);
		if(result == null) {
			db.tables.hubs.create({
				name: req.body.name,
				addr: req.body.addr
			}).then(function() {
				render.jade(res, 'success/hub');
			}, function(err) {
				console.log(err);
				render.server(res);
			});
		}
		else {
			render.jade(res, 'errors/eHub');
		}
	}, function(err) {
		console.log(err);
		render.server(res);
	})
};

//Создание статьи
function createArticle(req, res, status) {
	if(status == 0) {
		render.jade(res, 'errors/eConfirm');
	}
	else {
		var form = new formidable.IncomingForm({encoding: 'utf-8', uploadDir: 'temp', keepExtensions: true});
		form.parse(req, function(err, fields, files) {
			//Обработка изображений
			var valid_files = [];
			//Валидация файлов
			for(key in files) {
				if(checking.file(files[key])) {
					valid_files.push(files[key])
				}
			};

			//Получение автора
			checking.user(req).then(function(result) {
				var author_id = result;
				//Определение статуса статьи
				var article_status;
				if(fields.draft) {
					article_status = 0
				}
				else if(status == 1) {
					article_status = 1
				}
				else {
					article_status = 2
				}
				//Удаление html разметки
				fields = assist.safety(fields);
				//Создание записи в базе
				db.tables.articles.create({
					title: fields.title,
					text: fields.text,
					tags: fields.tags,
					hubId: fields.hub,
					author: author_id,
					status: article_status,
					images: valid_files.length
				}).then(function(result) {
					render.jade(res, 'success/article');
					var article_id = result.id;
					fs.mkdir('front/source/illustrations/' + article_id, function(err) {
						if(err) {
							console.log(err);
						}
						else {
							//Создание валидных изображений
							for(var i = 0; i < valid_files.length; i++) {
								ei.convert({
									src: valid_files[i].path,
									dst: './front/source/illustrations/' + article_id + '/img' + i + '.png'
								});
							}
						}
					})
				});
			}, function(err) {
				console.log(err);
				render.server(res);
			});
		});
	}
};

//Операции с черновой статьёй
function draftAction(req, res, user) {
	var num = req.params.name;
	db.tables.articles.findOne({where: {id: num, author: user, status: 0}}).then(function(result) {
		authent(req).then(function(status) {
			if(result != null) {
				var article_status = 2;
				if(status == 1) {
					article_status = 1;
				}
				console.log(req.body.type);
				switch(req.body.type) {
					case '1':
						//Публикация
						db.tables.articles.update({status: article_status}, {where: {id: num}}).then(function() {
							render.jade(res, 'success/article');
						}, function(err) {
							console.log(err);
							render.server(res);
						});
						break;
					case '2':
						//Редактирование
						pages.create_article(res, result);
						break;
					case '3':
						//Удаление
						db.tables.articles.destroy({where: {id: num}}).then(function() {
							render.jade(res, 'success/delete');
						}, function(err) {
							console.log(err);
							render.server(res);
						});
						break;
					default:
						//Сохранение редактирования
						editingDraft(req, res, num);
						break;
				}
			}
			else {
				render.error(res);
			}
		});
	}, function(err) {
		render.server(res);
	});
};

//Сохранение редактирования
function editingDraft(req, res, num) {
	var form = new formidable.IncomingForm({encoding: 'utf-8', uploadDir: 'temp', keepExtensions: true});
	form.parse(req, function(err, fields, files) {
		//Обработка изображений
		var valid_files = [];
		//Валидация файлов
		for(key in files) {
			if(checking.file(files[key])) {
				valid_files.push(files[key])
			}
		};
		//Удаление html разметки
		fields = assist.safety(fields);
		//Изменение записи в базе
		db.tables.articles.update({
			title: fields.title,
			text: fields.text,
			tags: fields.tags,
			hub: fields.hub
		}, {where: {id: num}}).then(function() {
			db.tables.articles.findOne({where: {id: num}}).then(function(article) {
			//Создание валидных изображений
				var sum_images = valid_files.length + article.images;
				var j = 0;
				for(var i = article.images; i < sum_images; i++) {
					ei.convert({
						src: valid_files[j].path,
						dst: './front/source/illustrations/' + num + '/img' + i + '.png'
					});
					j++;
				}
				//Увеличение счётчика изображений
				article.increment('images', {by: valid_files.length}).then(function() {
					res.redirect('/draft/' + num);
				}, function(err) {
					console.log(err);
					render.server(res);
				});
			}, function(err) {
				console.log(err);
				render.server(res);
			});	
		}, function(err) {
			console.log(err);
			render.server(res);
		});
	});
};

//Создание комментария
function addComment(req, res, user_id) {
	var num = req.params.name;
	if(req.body.text) {
		db.tables.comments.create({
			text: req.body.text,
			article: num,
			author: user_id,
			answer: req.body.answer
		}).then(function() {
			render.jade(res, 'success/comment');
		}, function(err) {
			console.log(err);
			render.server(res);
		})
	}
	else {
		render.error(res);
	}
};

exports.registration = registration;
exports.confirm = confirm;
exports.auth = auth;
exports.hub = createHub;
exports.create_article = createArticle;
exports.draft = draftAction;
exports.comment = addComment;