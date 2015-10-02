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
			console.log(article);
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

//Рендер черновика
function draft_render(req, res) {
	checking.user(req).then(function(user_id) {
		db.tables.articles.findAll({where: {author: user_id, status: 0}}).then(function(result) {
			//полученные статьи в черновике
			render.jade(res, 'draft', result);
		}, function(err) {
			serverError(err, res);
		})
	}, function(err) {
		serverError(err, res);
	});
};

//Рендер черновой статьи
function draft_article(req, res, user_id) {
	db.tables.articles.findOne({where: {
		id: req.params.name, 
		author: user_id, 
		status: 0
	}
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
	var hub_name = req.params.name;
	params.page *= 10;
	//Статьи хаба
	if(params.type == 1) {
		db.tables.hubs.find({where: {addr: hub_name}}).then(function(hub) {
			if(hub) {
				db.tables.articles.findAll({
					where: {hubId: hub.id, status: 2},
					offset: params.page,
					limit: 10,
					order: [['updatedAt', 'DESC']],
					include: [{model: db.tables.hubs}, {model: db.tables.users}]
				}).then(function(articles) {
					console.log(articles.length);
					res.end('WIN');
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
};

//Рендер ошибки и сообщение в консоль
function serverError(err, res) {
	console.log(err);
	render.server(res);
};

exports.create_article = create_article;
exports.draft = draft_render;
exports.article = article;
exports.draft_article = draft_article;
exports.list = list;