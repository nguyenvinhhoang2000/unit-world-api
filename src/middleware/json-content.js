const HttpStatus = require('http-status-codes')

const requireJsonContent = (req, res, next) => {
    // const contype = req.headers['Content-Type'];
    // if ((!contype || contype.indexOf('application/json') !== 0) && (!contype2 || contype2.indexOf('application/json') !== 0))
    //     return res.status(HttpStatus.UNPROCESSABLE_ENTITY).send({ errors: [{ msg: 'Server requires application/json' }] })
    next()
}

module.exports = requireJsonContent
