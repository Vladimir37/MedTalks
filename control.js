var Crypt = require('easy-encryption');
var random = require('random-token').create('0987654321');
var Redis = require('redis');
var formidable = require('formidable');
var fs = require('fs');
var ei = require('easyimage');

var render = require('./render');
var pages = require('./assist/pages');
var db = require('./assist/database');
var config = require('./configs/app_config');
var checking = require('./assist/checking');
var mail = require('./assist/mail');
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
			//Отправка письма
			var letter_obj = {
				key: key_mail,
				name: req.body.login
			};
			mail(req.body.mail, 'Регистрация на MedTalks', 'registration', letter_obj);
			//Создание профиля
			db.tables.profiles.create({
				id: result.id,
				sub_hubs: '[]',
				sub_users: '[]',
				sub_tags: '[]'
			}).then(function() {
				render.jade(res, 'registration_success');
			}, function(err) {
				//Ошибка базы
				console.log(err);
				render.server(res);
			})
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
		db.tables.users.update({status: user_status}, {
				where: {id: user_id}
		}).then(function() {
			render.jade(res, 'success/confirm');
		}, function(err) {
			console.log(err);
			render.server(res);
		})
	}, function(err) {
		console.log(err);
		render.error(res);
	});
};

//Авторизация
function auth(req, res) {
	var enter_login = req.body.login;
	var enter_pass = req.body.pass;
	db.tables.users.findOne({where: {mail: enter_login}}).then(function(result) {
		if(result && crypt_pass.decrypt(result.pass) == enter_pass && result.ban == 0) {
			if(result.status != 0) {
				var cookie_data = {};
				if(req.body.remember) {
					cookie_data.maxAge = 1210000000
				}
				redis.set(result.name, result.status);
				redis.expire(result.name, 1210000);
				res.cookie('mt_login', crypt_auth.encrypt(result.name), cookie_data);
				res.redirect('/roll');
			}
			else {
				render.jade(res, 'errors/eConfirm');
			}
		}
		else {
			render.jade(res, 'errors/eLogin');
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
function createArticle(req, res) {
	var status = req.user.status;
	if(status == 0) {
		render.jade(res, 'errors/eConfirm');
	}
	else if(req.user.ban == 1) {
		render.jade(res, 'errors/eBan');
	}
	else {
		var form = new formidable.IncomingForm({
			encoding: 'utf-8', 
			uploadDir: 'temp', 
			keepExtensions: true
		});
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
			var author_id = req.user.id;
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
				images: valid_files.length,
				voters: '[]'
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
		});
	}
};

//Операции с черновой статьёй
function draftAction(req, res, user) {
	var num = req.params.name;
	db.tables.articles.findOne({
		where: {
			id: num, 
			author: user, 
			status: 0
		}
	}).then(function(result) {
		if(req.user) {
			if(result != null) {
				var article_status = 2;
				if(req.user.status == 1) {
					article_status = 1;
				}
				else if(req.user.ban == 1) {
					article_status = 0;
				}
				switch(req.body.type) {
					case '1':
						//Публикация
						db.tables.articles.update({
							status: article_status
						}, {
							where: {id: num}
						}).then(function() {
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
		}
		else {
			render.error(res);
		}
	}, function(err) {
		render.server(res);
	});
};

//Сохранение редактирования
function editingDraft(req, res) {
	var num = req.user.id;
	var form = new formidable.IncomingForm({
		encoding: 'utf-8', 
		uploadDir: 'temp', 
		keepExtensions: true
	});
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
			db.tables.articles.findById(num).then(function(article) {
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
function addComment(req, res) {
	var num = req.params.name;
	if(req.body.text && req.user.ban == 0) {
		db.tables.comments.create({
			text: req.body.text,
			article: num,
			author: req.user.id,
			answer: req.body.answer,
			voters: '[]'
		}).then(function() {
			render.jade(res, 'success/comment');
			db.tables.users.findById(req.user.id).then(function(user) {
				user.increment('comments_count', {by: 1});
			});
		}, function(err) {
			console.log(err);
			render.server(res);
		})
	}
	else {
		render.error(res);
	}
};

//Редактирование профиля
function profile(req, res) {
	var user_id = req.user.id;
	var form = new formidable.IncomingForm({
		encoding: 'utf-8', 
		uploadDir: 'temp', 
		keepExtensions: true
	});
	form.parse(req, function(err, fields, files) {
		//Загрузка аватара
		if(fields.type == 1) {
			if(checking.file(files.avatar)) {
				ei.convert({
					src: files.avatar.path,
					dst: './front/source/avatars/' + user_id + '.png'
				});
				db.tables.users.update({avatar: 1}, {where: {id: user_id}}).then(function() {
					res.redirect('/profile');
				}, function(err) {
					console.log(err);
					render.server(res);
				});
			}
			else {
				render.jade(res, 'errors/eImage');
			}
		}
		//Редактирование текстовой информации
		else if(fields.type == 2) {
			db.tables.profiles.update({
				description: fields.desc,
				place: fields.place,
				contact_type: fields.contact_type,
				contact_address: fields.contact_address
			}, {where: {
				id: user_id
			}}).then(function() {
				res.redirect('/profile');
			}, function(err) {
				console.log(err);
				render.server(res);
			});
		}
		//Ошибка: редактирование без типа
		else {
			console.log('Ошибка - редактирование без типа');
			render.error(res);
		}
	});
};

//Подписка и отписка
function subscribe(req, res, type) {
	var target = req.params.name;
	db.tables.profiles.findOne({where: {id: req.user.id}}).then(function(profile) {
		var sub_type;
		switch(type) {
			case 1:
				//На юзера
				sub_type = 'sub_users';
				break;
			case 2:
				//На тег
				sub_type = 'sub_tags';
				break;
			case 3:
				//На хаб
				sub_type = 'sub_hubs';
				break;
			default:
				//Ошибка: подписка без типа
				render.server(err);
				break;
		};
		var sub_needed = JSON.parse(profile[sub_type]);
		var check_result = sub_needed.indexOf(target);
		//Подписка
		if(check_result == -1) {
			sub_needed.push(target);
			profile[sub_type] = JSON.stringify(sub_needed);
			profile.save().then(function() {
				render.jade(res, 'success/sub', target);
			}, function(err) {
				console.log(err);
				render.server(res);
			});
		}
		//Отписка
		else {
			sub_needed.splice(check_result, 1);
			profile[sub_type] = JSON.stringify(sub_needed);
			profile.save().then(function() {
				render.jade(res, 'success/unsub', target);
			});
		}
	}, function(err) {
		console.log(err);
		render.server(err);
	});
};

//Изменения рейтинга
function rating(req, res) {
	var r_type = req.params.type;
	var r_num = req.params.num;
	var r_change = req.body.type;
	db.tables[r_type].findById(r_num).then(function(result) {
		if(result) {
			var voters = JSON.parse(result.voters);
			if(voters.indexOf(req.user.id) == -1) {
				//Изменение рейтинга юзера
				db.tables.users.findById(result.author).then(function(voter) {
					//Новый голос
					if(r_change == 'plus') {
						result.rating++;
						voter.increment('rating', {by: 1});
					}
					else if(r_change == 'minus') {
						result.rating--;
						voter.decrement('rating', {by: 1});
					}
					else {
						render.error(res);
					}
					voters.push(req.user.id);
					result.voters = JSON.stringify(voters);
					result.save().then(function() {
						render.jade(res, 'success/rating');
					}, function(err) {
						console.log(err);
						render.server(res);
					})
				});
			}
			else {
				//Этот юзер уже голосовал
				render.error(res);
			}
		}
		else {
			render.error(res);
		}
	}, function(err) {
		render.error(res);
	})
};

//Операции со статьями в песочнице
function sandbox(req, res) {
	var num = req.params.name;
	var action = req.body.action;
	if(action == 1) {
		//Публикация
		db.tables.articles.findById(num).then(function(article) {
			article.increment('status', {by: 1});
			render.jade(res, 'success/article');
			db.tables.users.findById(article.author).then(function(user) {
				user.increment('articles_count', {by: 1});
				var letter_obj = {
					name: user.name,
					article: article.title,
					num: article.id
				};
				mail(user.mail, 'Статья принята', 'approve', letter_obj);
				if(++user.articles_count >= config.articles_for_confirm) {
					user.increment('status', {by: 1});
					var letter_obj = {
						name: user.name
					};
					mail(user.mail, 'Вы повышены!', 'raise', letter_obj);
				}
			});
		}, function(err) {
			render.server(res);
		});
	}
	else if(action == 0) {
		//Отклонение
		var reason = req.body.reason;
		db.tables.articles.findById(num).then(function(article) {
			article.decrement('status', {by: 1});
			render.jade(res, 'success/refuse');
			db.tables.users.findById(article.author).then(function(user) {
				var letter_obj = {
					name: user.name,
					article: article.title,
					reason: reason
				};
				mail(user.mail, 'Статья отклонена', 'refuse', letter_obj);
			});
		}, function(err) {
			render.server(res);
		});
	}
	else {
		//Ошибка: действие без типа
		render.error(res);
	}
};

//Бан
function ban(req, res) {
	var num = req.params.name;
	db.tables.users.findById(num).then(function(user) {
		user.increment('ban', {by: 1});
		render.jade(res, 'success/ban', user.name);
	}, function(err) {
		render.server(res);
	});
};

//Операции с паролем
function pass(req, res) {
	var act_type = req.body.type;
	var act_mail = req.body.mail;
	//Напоминание
	if(act_type == 1) {
		db.tables.users.findOne({where: {
			mail: act_mail
		}}).then(function(user) {
			if(user) {
				var password = crypt_pass.decrypt(user.pass);
				var letter_obj = {
					name: user.name,
					log: user.mail,
					pass: password
				};
				mail(user.mail, 'Восстановление доступа', 'pass_remind', letter_obj);
				render.jade(res, 'success/pass');
			}
			else {
				render.jade(res, 'errors/ePass');
			}
		}, function(err) {
			console.log(err);
			render.server(res);
		});
	}
	//Изменение
	else if(act_type == 2) {
		var old_pass = req.body.old_pass;
		var new_pass = req.body.new_pass;
		var new_pass_double = req.body.new_pass_double;
		if(new_pass == new_pass_double) {
			db.tables.users.findOne({where: {
				mail: act_mail
			}}).then(function(user) {
				if(user) {
					var current_pass = crypt_pass.decrypt(user.pass);
					if(current_pass == old_pass) {
						var entered_pass = crypt_pass.encrypt(new_pass);
						user.pass = entered_pass;
						user.save();
						render.jade(res, 'success/change');
					}
					else {
						render.jade(res, 'errors/ePass');
					}
				}
				else {
					render.jade(res, 'errors/ePass');
				}
			}, function(err) {
				render.server(res);
			})
		}
		else {
			render.jade(res, 'errors/ePassDouble');
		}
	}
	//Ошибка: операция без типа
	else {
		render.error(res);
	}
};

//Отправка статьи на переработку
function recicle(req, res) {
	var num = req.params.name;
	var reason = req.body.reason;
	db.tables.articles.findById(num).then(function(article) {
		article.status = 0;
		article.save();
		db.tables.users.findById(article.author).then(function(user) {
			user.decrement('articles_count', {by: 1});
			var letter_obj = {
				name: user.name,
				article: article.title,
				reason: reason
			};
			mail(user.mail, 'Статья отправлена на переработку', 'refuse', letter_obj);
			render.jade(res, 'success/recicle');
		});
	}, function(err) {
		render.server(res);
	});
};

//Теги в списке hubs
function hubs(req, res) {
	var act_type = req.body.type;
	var act_hub = req.body.hub;
	var act_tag = req.body.tag;
	fs.readFile('configs/hubs_tags.json', function(err, result) {
		if(err) {
			render.server(res);
		}
		else {
			var hubs_tags = JSON.parse(result);
			//Удаление тега
			if(act_type == 0) {
				var tag_num = hubs_tags[act_hub].indexOf(act_tag);
				hubs_tags[act_hub].splice(tag_num, 1);
			}
			//Добавление нового
			else if(act_type == 1) {
				if(!hubs_tags[act_hub]) {
					hubs_tags[act_hub] = [];
				}
				hubs_tags[act_hub].push(act_tag);
			}
			//Запись изменений
			fs.open('configs/hubs_tags.json', 'w', function(err, descriptor) {
				if(err) {
					render.server(res);
				}
				else {
					//
				}
			})
		}
	})
};

exports.registration = registration;
exports.confirm = confirm;
exports.auth = auth;
exports.hub = createHub;
exports.create_article = createArticle;
exports.draft = draftAction;
exports.comment = addComment;
exports.profile = profile;
exports.subscribe = subscribe;
exports.rating = rating;
exports.sandbox = sandbox;
exports.ban = ban;
exports.pass = pass;
exports.recicle = recicle;
exports.hubs = hubs;