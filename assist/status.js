//Проверка статуса юзера
function status(need_status) {
    return function(req, res, next) {
        if(req.user && req.user.status >= need_status) {
            next();
        }
        else {
            render.error(res);
        }
    }
};

module.exports = status;