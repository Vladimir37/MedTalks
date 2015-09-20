var Sequelize = require('sequelize');

var db_data = require('../configs/db_connect');

var sequelize = new Sequelize(db_data.name, db_data.login, db_data.pass, {
	dialect: db_data.dialect,
	port: db_data.port
});

sequelize.authenticate().then(function() {
	console.log('Подключение установлено!');
}, function(err) {
	console.log('Ошибка подключения: ' + err);
});

var tables = {};

tables.users = sequelize.define('users', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	mail: Sequelize.TEXT,
	name: Sequelize.TEXT,
	pass: Sequelize.TEXT,
	status: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	},
	rating: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	},
	ban: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	},
	key: Sequelize.TEXT
});

tables.articles = sequelize.define('articles', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	title: Sequelize.TEXT,
	text: Sequelize.TEXT,
	hub: Sequelize.INTEGER,
	author: Sequelize.INTEGER,
	status: Sequelize.INTEGER,
	rating: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	}
});

tables.comments = sequelize.define('comments', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	text: Sequelize.TEXT,
	article: Sequelize.INTEGER,
	author: Sequelize.INTEGER,
	answer: Sequelize.INTEGER,
	rating: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	}
});

tables.hubs = sequelize.define('hubs', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	name: Sequelize.TEXT
});

for(table in tables) {
	tables[table].sync({forsed: true}).then(function(result) {
		console.log('Таблица ' + result.name + ' успешно синхронизирована');
		}, function(err) {
		console.log('Ошибка синхронизации: ' + err);
	});
};

exports.tables = tables;