var Sequelize = require('sequelize');

var db_data = require('../configs/db_connect');

//Данные подключения
var sequelize = new Sequelize(db_data.name, db_data.login, db_data.pass, {
	dialect: db_data.dialect,
	port: db_data.port
});

//Проверка подключения
sequelize.authenticate().then(function() {
	console.log('Подключение установлено!');
}, function(err) {
	console.log('Ошибка подключения: ' + err);
});


//Инициализация таблиц
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
	avatar: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	},
	rating: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	},
	articles_count: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	},
	comments_count: {
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
	tags: Sequelize.TEXT,
	author: Sequelize.INTEGER,
	status: Sequelize.INTEGER,
	rating: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	},
	voters: Sequelize.TEXT,
	images: {
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
	answer: Sequelize.INTEGER,
	rating: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	},
	voters: Sequelize.TEXT
});

tables.hubs = sequelize.define('hubs', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	name: Sequelize.TEXT,
	addr: Sequelize.TEXT
});

tables.profiles = sequelize.define('profiles', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	place: Sequelize.TEXT,
	contact_type: Sequelize.INTEGER,
	contact_address: Sequelize.TEXT,
	description: Sequelize.TEXT,
	sub_hubs: Sequelize.TEXT,
	sub_users: Sequelize.TEXT,
	sub_tags: Sequelize.TEXT
});

//Ассоциации
//Авторы коментов
tables.comments.belongsTo(tables.users, {foreignKey: 'author'});
//Авторы статей
tables.articles.belongsTo(tables.users, {foreignKey: 'author'});
//Хабы статей
tables.articles.belongsTo(tables.hubs, {foreignKey: 'hubId'});
//Профили с юзерами
tables.users.hasOne(tables.profiles, {foreignKey: 'id'});

//Синхронизация и создание всех таблиц
for(table in tables) {
	tables[table].sync({forsed: true}).then(function(result) {
		console.log('Таблица ' + result.name + ' успешно синхронизирована');
		}, function(err) {
		console.log('Ошибка синхронизации: ' + err);
	});
};

//Возвращение только одного массива с названиями из выборки
function select(arr, name) {
	var result = [];
	for(var i = 0; i < arr.length; i++) {
		result[i] = arr[i][name];
	}
	return result;
};

exports.tables = tables;
exports.select = select;