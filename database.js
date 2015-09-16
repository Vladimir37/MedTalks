var Sequelize = require('sequelize');

var sequelize = new Sequelize('medtalks', 'root', 'node_db', {
	dialect: 'mysql',
	port: 3306
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
	name: {
		type: Sequelize.TEXT,
		unique: true
	},
	status: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	},
	rating: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	},
	key: Sequelize.INTEGER
});

tables.articles = sequelize.define('articles', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	name: {
		type: Sequelize.TEXT,
		unique: true
	},
	text: Sequelize.TEXT,
	hub: Sequelize.INTEGER,
	author: Sequelize.INTEGER,
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
	name: {
		type: Sequelize.TEXT,
		unique: true
	}
});

// for(table in tables) {
// 	console.log(tables.hubs);
// 	table.sync({forsed: true}).success(function() {
// 		console.log('Таблица успешно синхронизирована');
// 	}).error(function(err) {
// 		console.log('Ошибка синхронизации: ' + err);
// 	});
// };