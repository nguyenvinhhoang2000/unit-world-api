const Ajv = require('ajv')
const statusCode = require('http-status-codes')
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
const Joi = require('joi')

const jsonValidate = (schema) => {
    const validate = ajv.compile(schema)

    return (req, res, next) => {
        const data = {...req.body, ...req.query}
        const {lang} = req.headers
        if (lang == null) {
            req.headers.lang = 'en'
        }
        if (!['en', 'vn'].includes(String(lang))) {
            return res.status(statusCode.UNPROCESSABLE_ENTITY).json({
                msg: `lang = ${lang} - incorrect`,
            })
        }

        const valid = validate(data)
        if (!valid) {
            console.log(validate)
            console.log(validate.errors[0])
            console.log(validate.errors[0].instancePath + ' ' + validate.errors[0].message)

            let error = validate.errors[0]
            if (error.instancePath == '') {
                error = [
                    {
                        src: error.params.missingProperty,
                        err: 'Must have required property' + error.params.missingProperty,
                        ...error.params,
                    },
                ]
            } else {
                error = [
                    {
                        src: error.instancePath.substring(1, error.instancePath.length),
                        err: error.message,
                        ...error.params,
                    },
                ]
            }
            res.status(statusCode.UNPROCESSABLE_ENTITY).json({
                msg: validate.errors[0].instancePath + ' ' + validate.errors[0].message,
                errs: error,
            })
        } else {
            return next()
        }
    }
}

const joiValidate = (schema) => {
    return (req, res, next) => {
        const data = {...req.body, ...req.query}
        const {lang} = req.headers
        if (lang == null) {
            req.headers.lang = 'en'
        }
        if (!['en', 'vn'].includes(String(lang))) {
            return res.status(statusCode.UNPROCESSABLE_ENTITY).json({
                msg: `lang = ${lang} - incorrect`,
            })
        }

        const rst = schema.validate(data)
        if (rst.error) {
            res.status(statusCode.UNPROCESSABLE_ENTITY).json({
                msg: `Input param incorrect ${req.path}`,
                errs: rst.error,
            })
        } else {
            return next()
        }
    }
}

module.exports = {
    jsonValidate,
    joiValidate,
}
