var jade = require('jade');
var fs = require('fs');

var db = require('./assist/database');

//Рендер Jade
function renderJade(res, name) {
	var jade_data = {};
	for(var i = 0; i < arguments.length - 2; i++) {
		jade_data['data' + i] = arguments[i + 2];
	};
	jade_data.auth = res.auth;
	//Поиск последних статей
	db.tables.articles.findAll({
		where: {
			status: 2
		},
		limit: 10,
		order: [['updatedAt', 'DESC']]
	}).then(function(news) {
		jade_data.news = news;
		//Поиск последних коментов
		db.tables.comments.findAll({
			limit: 4,
			order: [['updatedAt', 'DESC']],
			include: [{model: db.tables.users}]
		}).then(function(comments) {
			jade_data.comments = comments;
			jade.renderFile('front/pages/' + name + '.jade', jade_data, function(err, result) {
				if(err) {
					console.log(err);
					renderError(res);
				}
				else {
					res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
					res.end(result);
				}
			});
		})
	}, function(err) {
		console.log(err);
		serverError(res);
	});
};

//Рендер Jade в роутере
function routeJade(name, addition) {
    return function(req, res) {
        renderJade(res, name, addition);
    };
};

//Ошибка 404
function renderError(res) {
	renderJade(res, 'errors/e404');
};

//Ошибка 404 (в роутере)
function routeError(req, res) {
    renderJade(res, 'errors/e404');
};

//Ошибка 500 (на сервере)
function serverError(res) {
	renderJade(res, 'errors/eServer');
}

//Рендер ресурсов
function renderSource(req, res) {
    var name = req.url;
	fs.readFile('front' + name, function(err, result) {
		if(err) {
			renderError(res);
		}
		else {
			res.end(result);
		}
	})
};

exports.jade = renderJade;
exports.route_jade = routeJade;
exports.source = renderSource;
exports.error = renderError;
exports.route_error = routeError;
exports.server = serverError;