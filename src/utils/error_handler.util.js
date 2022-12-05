const RestError = require('./error.util')

const ErrorHandler = (err, req, res, next) => {
    // console.log(err instanceof RestError)
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // add this line to include winston logging
    // winston.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    console.error(
        `[Error - ${new Date()}] ${err.status || 500} - ${err.message} - ${
            (req && req.user && req.user._id) || 'Unauthorization'
        } - ${req.originalUrl} - ${req.method} - ${req.socket.remoteAddress} `,
    )
    if (err instanceof RestError) {
        if (err.isPublic)
            res.status(err.status).json({
                code: err.code,
                error: err.message,
                msg: err.message,
                errs: err.errs,
            })
        else
            res.status(err.status).json({
                code: err.code,
                msg: err.message,
                errs: err.errs,
            })
    } else {
        console.log(err)
        res.status(500).json({
            code: err.code,
            error: 'internal_server_error',
            msg: err.message,
        })
    }
}

module.exports = ErrorHandler
