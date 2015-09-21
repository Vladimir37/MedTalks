var db = require('./database');
var render = require('./../render');

function create_article(res) {
	db.tables.hubs.findAll().then(function(result) {
		render.jade(res, 'create_article', result);
	}, function(err) {
		serverError(err);
	})
}

function serverError(err) {
	console.log(err);
	render.error(res);
};

exports.create_article = create_article;