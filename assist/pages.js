var db = require('./database');
var render = require('./../render');
var checking = require('./checking');
var assist = require('./assist');

//Рендер публичной статьи
function article(req, res) {
	var num = req.params.name;
	db.tables.articles.findOne({
		where: {id: num, status: 2}, 
		include: [{model: db.tables.hubs}, {model: db.tables.users}]
	}).then(function(article) {
		if(article == null) {
			render.error(res);
		}
		else {
			//Рендер изображений
			article = assist.images(article);
			//Поиск комментариев к статье
			db.tables.comments.findAll({
				where: {article: num}, 
				include: [{model: db.tables.users}]
			}).then(function(comments) {
				render.jade(res, 'article', article, comments);
			}, function(err) {
				serverError(err, res);
			});
		}
	}, function(err) {
		serverError(err, res);
	})
}

//Создание и изменение статьи статьи (запрос хабов)
function create_article(res, article) {
	db.tables.hubs.findAll().then(function(result) {
		if(article) {
			render.jade(res, 'draft_edit', result, article);
		}
		else {
			render.jade(res, 'create_article', result);
		}
	}, function(err) {
		serverError(err, res);
	})
};

//Рендер черновой статьи
function draft_article(req, res) {
	db.tables.articles.findOne({where: {
		id: req.params.name, 
		author: req.user.id, 
		status: 0
	}, include: [{model: db.tables.users}, {model: db.tables.hubs}]
	}).then(function(result) {
		if(result == null) {
			render.error(res);
		}
		else {
			result = assist.images(result);
			render.jade(res, 'draft_article', result);
		}
	}, function(err) {
		serverError(err, res);
	})
};

//Рендер списка статей
function list(req, res, params) {
	var target_name = req.params.name;
	var start_article = params.page * 10;
	//По хабу
	if(params.type == 1) {
		db.tables.hubs.find({where: {addr: target_name}}).then(function(hub) {
			if(hub) {
				db.tables.articles.findAndCountAll({
					where: {hubId: hub.id, status: 2},
					offset: start_article,
					limit: 10,
					order: [['updatedAt', 'DESC']],
					include: [{model: db.tables.hubs}, {model: db.tables.users}]
				}).then(function(articles) {
					if(articles.rows) {
						var page_data = {
							current: params.page,
							total: Math.floor(articles.count / 10)
						}
						articles.rows = assist.imagesArr(articles.rows);
						render.jade(res, 'hub_list', articles.rows, hub, page_data, req.user);
					}
					else {
						render.error(res);
					}
				}, function(err) {
					serverError(err, res);
				})
			}
			else {
				render.error(res);
			}
		}, function(err) {
			serverError(err, res);
		})
	}
	//По автору
	else if(params.type == 2) {
		db.tables.users.find({where: {name: target_name}}).then(function(user) {
			if(user) {
				db.tables.articles.findAndCountAll({
					where: {author: user.id, status: 2},
					offset: start_article,
					limit: 10,
					order: [['updatedAt', 'DESC']],
					include: [{model: db.tables.hubs}, {model: db.tables.users}]
				}).then(function(articles) {
					if(articles.rows) {
						var page_data = {
							current: params.page,
							total: Math.floor(articles.count / 10)
						}
						articles.rows = assist.imagesArr(articles.rows);
						render.jade(res, 'author_list', articles.rows, user, page_data, req.user);
					}
					else {
						render.error(res);
					}
				}, function(err) {
					serverError(err, res);
				})
			}
			else {
				render.error(res);
			}
		}, function(err) {
			serverError(err, res);
		})
	}
	//По тегу
	else if(params.type == 3) {
		db.tables.articles.findAndCountAll({
			where: {
				status: 2, tags: {
					$like: '%' + target_name + '%'
				}
			},
			offset: start_article,
			limit: 10,
			order: [['updatedAt', 'DESC']],
			include: [{model: db.tables.hubs}, {model: db.tables.users}]
		}).then(function(articles) {
			if(articles.rows) {
				var page_data = {
					current: params.page,
					total: Math.floor(articles.count / 10)
				};
				articles.rows = assist.imagesArr(articles.rows);
				render.jade(res, 'tag_list', articles.rows, target_name, page_data, req.user);
			}
			else {
				render.error(res);
			}
		}, function(err) {
			serverError(err, res);
		})
	}
	//Черновик
	else if(params.type == 4) {
		db.tables.articles.findAll({where: {
			author: req.user.id, 
			status: 0
		}}).then(function(result) {
			//Полученные статьи в черновике
			render.jade(res, 'draft', result);
		}, function(err) {
			serverError(err, res);
		});
	}
};

//Просмотр своего профиля
function profile(req, res) {
	render.jade(res, 'profile', req.user);
};

//Просмотр чужого профиля
function user(req, res) {
	var user_name = req.params.name;
	db.tables.users.findOne({
		where: {name: user_name}, 
		include: [{model: db.tables.profiles}]
	}).then(function(user_data) {
		if(user_data) {
			render.jade(res, 'user_profile', user_data, req.user);
		}
		else {
			render.error(res);
		}
	}, function(err) {
		serverError(err, res);
	});
};

//Рендер ошибки и сообщение в консоль
function serverError(err, res) {
	console.log(err);
	render.server(res);
};

exports.create_article = create_article;
exports.article = article;
exports.draft_article = draft_article;
exports.list = list;
exports.profile = profile;
exports.user = user;