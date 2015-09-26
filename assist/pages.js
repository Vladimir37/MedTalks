var db = require('./database');
var render = require('./../render');
var checking = require('./checking');
var assist = require('./assist');

//Рендер публичной статьи
function article(req, res) {
	var name = req.params.name;
	db.tables.articles.findOne({where: {id: name, status: 2}}).then(function(article) {
		if(article == null) {
			render.error(res);
		}
		else {
			//Рендер изображений
			article = assist.images(article);
			//Замена номера автора на имя
			assist.user(article).then(function(result) {
				render.jade(res, 'article', result);
			}, function(err) {
				serverError(err);
			});
		}
	}, function(err) {
		serverError(err);
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
		serverError(err);
	})
};

//Рендер черновика
function draft_render(req, res) {
	checking.user(req).then(function(user_id) {
		db.tables.articles.findAll({where: {author: user_id, status: 0}}).then(function(result) {
			//полученные статьи в черновике
			render.jade(res, 'draft', result);
		}, function(err) {
			serverError(err);
		})
	}, function(err) {
		serverError(err);
	});
};

//Рендер черновой статьи
function draft_article(req, res, user_id) {
	db.tables.articles.findOne({where: {id: req.params.name, author: user_id, status: 0}}).then(function(result) {
		if(result == null) {
			render.error(res);
		}
		else {
			result = assist.images(result);
			render.jade(res, 'draft_article', result);
		}
	}, function(err) {
		serverError(err);
	})
};

//Рендер ошибки и сообщение в консоль
function serverError(err) {
	console.log(err);
	render.server(res);
};

exports.create_article = create_article;
exports.draft = draft_render;
exports.article = article;
exports.draft_article = draft_article;