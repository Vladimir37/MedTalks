var db = require('./database');
var render = require('./../render');
var checking = require('./checking');

//Рендер публичной статьи
function article(req, res) {
	var name = req.params.name;
	db.tables.articles.findOne({where: {id: name, status: 2}}).then(function(result) {
		if(result == null) {
			render.error(res);
		}
		else {
			result.text = result.text.replace(/\[ЗагруженноеИзображение(.+?)\]/g, '<img src="/source/illustrations/' + result.id + '/img$1' + '.png' + '" alt="illustration">');
			//.replace(/\[ЗагруженноеИзображение(.+?)\]/g, '<img src="/sourse/illustrations/num/$1" alt="illustration">');
			render.jade(res, 'article', result);
		}
	}, function(err) {
		serverError(err);
	})
}

//Создание статьи (запрос хабов)
function create_article(res) {
	db.tables.hubs.findAll().then(function(result) {
		render.jade(res, 'create_article', result);
	}, function(err) {
		serverError(err);
	})
};

//Рендер черновика
function draft_render(req, res) {
	checking.user(req).then(function(user_id) {
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