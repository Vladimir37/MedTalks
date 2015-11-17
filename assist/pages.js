var fs = require('fs');

var db = require('./database');
var render = require('../render');
var checking = require('./checking');
var assist = require('./assist');

//Рендер публичной статьи
function article(req, res) {
	var num = req.params.name;
	db.tables.articles.findOne({
		where: {
			id: num, 
			status: 2
		}, 
		include: [
			{model: db.tables.hubs}, 
			{model: db.tables.users}
		]
	}).then(function(article) {
		if(article == null) {
			render.error(res);
		}
		else {
			//Рендер изображений
			article = assist.images(article);
			//Поиск комментариев к статье
			db.tables.comments.findAll({
				where: {article: num}, 
				include: [{model: db.tables.users}]
			}).then(function(comments) {
				//Проверка на возможность голосовать
				//Комменты
				if(req.user) {
					comments.forEach(function(item) {
						item.vote = 0;
						var com_voters = JSON.parse(item.voters);
						if(item.author == req.user.id) {
							item.vote = 2;
						}
						else if(com_voters.indexOf(req.user.id) == -1) {
							item.vote = 1;
						}
					});
					//Статья
					article.vote = 0;
					var art_voters = JSON.parse(article.voters);
					if(article.author == req.user.id) {
						article.vote = 2;
					}
					else if(art_voters.indexOf(req.user.id) == -1) {
						article.vote = 1;
					}
				}
				//Рендер
				render.jade(res, 'article', article, comments, req.user);
			}, function(err) {
				serverError(err, res);
			});
		}
	}, function(err) {
		serverError(err, res);
	})
}

//Создание и изменение статьи статьи (запрос хабов)
function create_article(req, res, article) {
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

//Рендер черновой статьи
function draft_article(req, res) {
	db.tables.articles.findOne({where: {
		id: req.params.name, 
		author: req.user.id, 
		status: 0
	}, include: [{model: db.tables.users}, {model: db.tables.hubs}]
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
function list(params) {
	return function(req, res) {
        var target_name = req.params.name;
        var start_article = params.page * 10;
        //По хабу
        if (params.type == 1) {
            db.tables.hubs.find({where: {addr: target_name}}).then(function (hub) {
                if (hub) {
                    db.tables.articles.findAndCountAll({
                        where: {hubId: hub.id, status: 2},
                        offset: start_article,
                        limit: 10,
                        order: [['updatedAt', 'DESC']],
                        include: [{model: db.tables.hubs}, {model: db.tables.users}]
                    }).then(function (articles) {
                        if (articles.rows) {
                            var page_data = {
                                current: params.page,
                                total: Math.floor(articles.count / 10)
                            }
                            articles.rows = assist.imagesArr(articles.rows);
                            render.jade(res, 'lists/hub_list', articles.rows, hub, page_data, req.user);
                        }
                        else {
                            render.error(res);
                        }
                    }, function (err) {
                        serverError(err, res);
                    })
                }
                else {
                    render.error(res);
                }
            }, function (err) {
                serverError(err, res);
            })
        }
        //По автору
        else if (params.type == 2) {
            db.tables.users.find({where: {name: target_name}}).then(function (user) {
                if (user) {
                    db.tables.articles.findAndCountAll({
                        where: {author: user.id, status: 2},
                        offset: start_article,
                        limit: 10,
                        order: [['updatedAt', 'DESC']],
                        include: [{model: db.tables.hubs}, {model: db.tables.users}]
                    }).then(function (articles) {
                        if (articles.rows) {
                            var page_data = {
                                current: params.page,
                                total: Math.floor(articles.count / 10)
                            }
                            articles.rows = assist.imagesArr(articles.rows);
                            render.jade(res, 'lists/author_list', articles.rows, user, page_data, req.user);
                        }
                        else {
                            render.error(res);
                        }
                    }, function (err) {
                        serverError(err, res);
                    })
                }
                else {
                    render.error(res);
                }
            }, function (err) {
                serverError(err, res);
            })
        }
        //По тегу
        else if (params.type == 3) {
            db.tables.articles.findAndCountAll({
                where: {
                    status: 2, tags: {
                        $like: '%' + target_name + '%'
                    }
                },
                offset: start_article,
                limit: 10,
                order: [['updatedAt', 'DESC']],
                include: [{model: db.tables.hubs}, {model: db.tables.users}]
            }).then(function (articles) {
                if (articles.rows) {
                    var page_data = {
                        current: params.page,
                        total: Math.floor(articles.count / 10)
                    };
                    articles.rows = assist.imagesArr(articles.rows);
                    render.jade(res, 'lists/tag_list', articles.rows, target_name, page_data, req.user);
                }
                else {
                    render.error(res);
                }
            }, function (err) {
                serverError(err, res);
            })
        }
        //Черновик
        else if (params.type == 4) {
            db.tables.articles.findAll({
                where: {
                    author: req.user.id,
                    status: 0
                }
            }).then(function (result) {
                //Полученные статьи в черновике
                render.jade(res, 'lists/draft', result);
            }, function (err) {
                serverError(err, res);
            });
        }
        //Песочница
        else if (params.type == 5) {
            db.tables.articles.findAndCountAll({
                where: {
                    status: 1
                },
                offset: start_article,
                limit: 10,
                order: [['updatedAt', 'DESC']],
                include: [{model: db.tables.hubs}, {model: db.tables.users}]
            }).then(function (articles) {
                if (articles.rows) {
                    var page_data = {
                        current: params.page,
                        total: Math.floor(articles.count / 10)
                    };
                    articles.rows = assist.imagesArr(articles.rows);
                    render.jade(res, 'lists/sandbox_list', articles.rows, target_name, page_data, req.user);
                }
                else {
                    render.error(res);
                }
            }, function (err) {
                serverError(err, res);
            });
        }
        //Личная лента
        else if (params.type == 6) {
            //Парсинг JSON
            var s_hubs = JSON.parse(req.user.profile.sub_hubs);
            var s_users = JSON.parse(req.user.profile.sub_users);
            var s_tags = JSON.parse(req.user.profile.sub_tags);
            //Получение номеров хабов
            db.tables.hubs.findAll({
                where: {
                    name: {
                        $in: s_hubs
                    }
                }
            }).then(function (hubs_num) {
                var n_hubs = db.select(hubs_num, 'id');
                //Получение номеров юзеров
                db.tables.users.findAll({
                    where: {
                        name: {
                            $in: s_users
                        }
                    }
                }).then(function (users_num) {
                    var n_users = db.select(users_num, 'id');
                    //Создание объекта для поиска по тегам
                    var n_tags = [];
                    s_tags.forEach(function (item) {
                        n_tags.push({
                            tags: {
                                $like: '%' + item + '%'
                            }
                        });
                    });
                    n_tags.push({
                            hubId: {
                                $in: n_hubs
                            }
                        },
                        {
                            author: {
                                $in: n_users
                            }
                        });
                    //Поиск и рендер
                    db.tables.articles.findAndCountAll({
                        where: {
                            $or: n_tags
                        },
                        offset: start_article,
                        limit: 10,
                        order: [['updatedAt', 'DESC']],
                        include: [{model: db.tables.hubs}, {model: db.tables.users}]
                    }).then(function (articles) {
                        //Данные страниц
                        var page_data = {
                            current: params.page,
                            total: Math.floor(articles.count / 10)
                        };
                        articles.rows = assist.imagesArr(articles.rows);
                        render.jade(res, 'lists/roll_list', articles.rows, page_data, req.user);
                    }, function (err) {
                        serverError(err, res);
                    });
                });
            });
        }
        //Все статьи
        else if (params.type == 7) {
            db.tables.articles.findAndCountAll({
                where: {
                    status: 2
                },
                offset: start_article,
                limit: 10,
                order: [['updatedAt', 'DESC']],
                include: [{model: db.tables.hubs}, {model: db.tables.users}]
            }).then(function (articles) {
                if (articles.rows) {
                    var page_data = {
                        current: params.page,
                        total: Math.floor(articles.count / 10)
                    };
                    articles.rows = assist.imagesArr(articles.rows);
                    render.jade(res, 'lists/main_list', articles.rows, page_data, req.user);
                }
                else {
                    render.error(res);
                }
            }, function (err) {
                serverError(err, res);
            });
        }
        //Ошибка: Список без типа
        else {
            render.error(res);
        }
    }
};

//Просмотр чужого профиля
function user(req, res) {
	var user_name = req.params.name;
	db.tables.users.findOne({
		where: {name: user_name}, 
		include: [{model: db.tables.profiles}]
	}).then(function(user_data) {
		if(user_data) {
			render.jade(res, 'user_profile', user_data, req.user);
		}
		else {
			render.error(res);
		}
	}, function(err) {
		serverError(err, res);
	});
};

//Просмотр статьи в песочнице
function sandbox(req, res) {
	var num = req.params.name;
	db.tables.articles.findOne({
		where: {
			id: num,
			status: 1
		},
		include: [
			{model: db.tables.hubs}, 
			{model: db.tables.users}
		]
	}).then(function(article) {
		render.jade(res, 'sandbox_item', article);
	}, function(err) {
		serverError(err, res);
	});
};

//Поиск
function search(req, res) {
	var query = '%' + req.body.search + '%';
	if(query.length < 30) {
		db.tables.articles.findAll({where: {
			$or: [
				{title: {
					$like: query
				}},
				{text: {
					$like: query
				}},
				{tags: {
					$like: query
				}}
			]
		}, 
		order: [['updatedAt', 'DESC']],
		include: [{model: db.tables.hubs}, {model: db.tables.users}]
		}).then(function(result) {
			render.jade(res, 'search', result);
		}, function (err) {
			serverError(err, res);
		});
	}
	else {
		render.jade(res, 'errors/eSearch');
	}
};

//Список хабов с тегами
function hubs(req, res) {
	db.tables.hubs.findAll().then(function(hubs_list) {
		fs.readFile('configs/hubs_tags.json', function(err, result) {
			if(err) {
				render.server(res);
			}
			else {
				var hubs_tags = JSON.parse(result);
				render.jade(res, 'hubs', hubs_list, hubs_tags, req.user);
			}
		});
	}, function(err) {
		serverError(err, res);
	});
};

//Рендер ошибки и сообщение в консоль
function serverError(err, res) {
	console.log(err);
	render.server(res);
};

exports.create_article = create_article;
exports.article = article;
exports.draft_article = draft_article;
exports.list = list;
exports.user = user;
exports.sandbox = sandbox;
exports.search = search;
exports.hubs = hubs;