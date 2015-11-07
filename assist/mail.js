var nodemailer = require('nodemailer');
var jade = require('jade');

var config = require('../configs/mail_data');

//Указание данных подключения
var transporter = nodemailer.createTransport({
	service: config.service,
	auth: {
		user: config.login,
		pass: config.pass
	}
});

//Функция отправки
function send(address, subject, text) {
	//Данные отправки
	var mailOptions = {
		from: config.from, //от кого
		to: address, //кому
		subject: subject, //тема
		html: text //HTML письма
	};
	//Результат отправки
    transporter.sendMail(mailOptions, function(error, info){
        if(error) {
            console.log('Ошибка при отправке письма: ' + error);
        }
        else {
            console.log('Письмо успешно отправлено: ' + info.response);
        }
    });
};

function template(address, subject, name, obj) {
	console.log()
	jade.renderFile('mails/' + name + '.jade', obj, function(err, result) {
		if(err) {
			console.log(err);
		}
		else {
			send(address, subject, result);
		}
	});
};

module.exports = template;