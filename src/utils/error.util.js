const statusCode = require('http-status-codes')
module.exports = class RestError extends Error {
    constructor(status, code, error, message, isPublic = false, isOperational = true, errs = []) {
        super(message)
        this.code = code
        this.name = this.constructor.name
        this.status = status
        this.error = error
        this.errs = errs
        this.isPublic = isPublic
        this.isOperational = isOperational
    }

    static NewInternalServerError(message, code = 1, errs = []) {
        return new RestError(
            statusCode.INTERNAL_SERVER_ERROR,
            code,
            'internal_server_error',
            message,
            false,
            true,
            errs,
        )
    }

    static NewTooManyRequestError(message, code = 1, errs = []) {
        return new RestError(statusCode.TOO_MANY_REQUESTS, code, 'too_many_request', message, false, true, errs)
    }

    static NewNotFoundError(message, code = 1, errs = []) {
        return new RestError(statusCode.NOT_FOUND, code, 'not_found', message, false, true, errs)
    }

    static NewBadRequestError(message, code = 1, errs = []) {
        return new RestError(statusCode.BAD_REQUEST, code, 'bad_request', message, false, true, errs)
    }

    static NewForbiddenError(message, code = 1, errs = []) {
        return new RestError(statusCode.FORBIDDEN, code, 'permission_denied', message, false, true, errs)
    }

    static NewUnAuthenticateError(message, code = 1, errs = []) {
        return new RestError(statusCode.UNAUTHORIZED, code, 'permission_denied', message, false, true, errs)
    }

    static NewInvalidInputError(message, code = 1, errs = []) {
        return new RestError(statusCode.UNPROCESSABLE_ENTITY, code, 'invalid_input', message, false, true, errs)
    }

    static NewNotAcceptableError(message, code = 1, errs = []) {
        return new RestError(statusCode.NOT_ACCEPTABLE, code, 'not_acceptable', message, false, true, errs)
    }

    static NewRefreshTokenExpired(message, code = 1, errs = []) {
        return new RestError(499, code, 'refresh_token_expired', message, false, true, errs)
    }

    /**
     * example
     * errs: [
        { src: 'name', err: 'MAX_LENGTH', maxLength: 120 },
        { src: 'images[3]', err: 'MIME', mime: ['jpg', 'jpeg', 'gif', 'png' ] },
        { src: 'variants[0].price', err: 'REQUIRED' },
        { src: 'variants[2].quantity', err: 'NUMBER' },
    ],
    */

    static NewDuplicateDataError(message, code = 1, errs = []) {
        return new RestError(423, code, 'duplicate_error', message, false, true, errs)
    }
}
