var db = require('./database');

//Рендер картинок на странице
function imagesRender(article) {
	article.text = article.text.replace(/\[ЗагруженноеИзображение(.+?)\]/g, '<img src="/source/illustrations/' + article.id + '/img$1' + '.png' + '" alt="illustration">');
	return article;
};

//Рендер картинок в выборке статей
function imagesRenderArray(arr) {
	arr.forEach(function(item) {
		item = imagesRender(item);
	});
	return arr;
};

//Удаление html-разметки из статей
function safetyText(obj) {
	for(field in obj) {
		obj[field] = obj[field].replace(/\</g, '&#60;');
		obj[field] = obj[field].replace(/\>/g, '&#62;');
	}
	return obj;
};

//Получение имени юзера по id
function getUser(article) {
	return new Promise(function(resolve, reject) {
		db.tables.users.findOne({where: {id: article.author}}).then(function(result) {
			if(result == null) {
				reject('Not user');
			}
			else {
				article.author = result.name;
				resolve(article);
			}
		}, function(err) {
			console.log(err);
			reject('Server Error');
		})
	});
};

exports.images = imagesRender;
exports.imagesArr = imagesRenderArray;
exports.safety = safetyText;
exports.user = getUser;