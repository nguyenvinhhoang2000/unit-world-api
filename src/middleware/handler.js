const {responseHandle} = require('../utils/response-handle.util')

exports.apiHandler = (asyncCb) => {
    return async (req, res, next) => {
        try {
            const file = req.file
            const {lang} = req.headers
            const {user} = req
            const data = {user, ...req.body, ...req.query, ...req.params, lang, path: req.path, file}
            const result = await asyncCb(data)
            await responseHandle(result, req, res)
        } catch (error) {
            next(error)
        }
    }
}

exports.apiFilesHandler = (asyncCb) => {
    return async (req, res, next) => {
        try {
            const result = await asyncCb(req, next)
            await responseHandle(result, req, res)
        } catch (error) {
            next(error)
        }
    }
}
