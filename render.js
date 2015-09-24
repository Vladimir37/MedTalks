var jade = require('jade');
var fs = require('fs');

var db = require('./assist/database');

//Рендер Jade
function renderJade(res, name) {
	var jade_data = {};
	for(var i = 0; i < arguments.length - 2; i++) {
		jade_data['data' + i] = arguments[i + 2];
	};
	jade.renderFile('front/pages/' + name + '.jade', jade_data, function(err, result) {
		if(err) {
			console.log(err);
			renderError(res);
		}
		else {
			res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
			res.end(result);
		}
	});
};

//Ошибка 404
function renderError(res) {
	jade_data = {};
	for(var i = 0; i < arguments.length - 1; i++) {
		jade_data['data' + i] = arguments[i + 1];
	};
	res.writeHead(404, {'Content-Type': 'text/html; charset=utf-8'});
	jade.renderFile('front/pages/errors/e404.jade', jade_data, function(err, result) {
		res.end(result);
	});
};

//Ошибка 500 (на сервере)
function serverError(res) {
	jade_data = {};
	for(var i = 0; i < arguments.length - 1; i++) {
		jade_data['data' + i] = arguments[i + 1];
	};
	res.writeHead(500, {'Content-Type': 'text/html; charset=utf-8'});
	jade.renderFile('front/pages/errors/eServer.jade', jade_data, function(err, result) {
		res.end(result);
	});
}

//Рендер ресурсов
function renderSource(res, name) {
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
exports.source = renderSource;
exports.error = renderError;
exports.server = serverError;