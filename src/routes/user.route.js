const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const jsonParser = bodyParser.json()

//middleware
const TokenAuthenticate = require('../middleware/authenticate')

const RequireJsonContent = require('../middleware/json-content')

const {jsonValidate} = require('../middleware/json-validate')
const {UserSchema} = require('../middleware/validate/index')

const Roles = require('../middleware/role-authenticate')
//utils
const {responseHandle} = require('../utils/response-handle.util')

const {apiHandler, apiFilesHandler} = require('../middleware/handler')
const { adminView, ROLES, roleAuthorize } = require('../middleware/role-authenticate')

class User {
    constructor(opts) {
        this.ctrl = opts.ctrl
        this.router = express.Router()

        this.router.post(
            '/login',
            jsonParser,
            RequireJsonContent,
            jsonValidate(UserSchema.loginSchema),
            async (req, res, next) => {
                try {
                    let {lang} = req.headers
                    let {username, password, re_captcha, tfa_code} = req.body
                    let result = await this.ctrl.User.login({
                        lang,
                        username,
                        password,
                        re_captcha,
                        remoteAddress: req.connection.remoteAddress,
                        tfa_code,
                    })
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.post(
            '/register',
            jsonParser,
            RequireJsonContent,
            jsonValidate(UserSchema.registerSchema),
            async (req, res, next) => {
                try {
                    let {lang} = req.headers
                    let {
                        username,
                        name,
                        password,
                        confirm_password,
                        email,
                        country,
                        dob,
                        gender,
                        subscribe,
                        re_captcha,
                        referrer,
                    } = req.body
                    let result = await this.ctrl.User.register({
                        username,
                        name,
                        password,
                        confirm_password,
                        email,
                        country,
                        dob,
                        gender,
                        lang,
                        subscribe,
                        re_captcha,
                        remoteAddress: req.connection.remoteAddress,
                        referrer,
                    })
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.post(
            '/resend-verify-email',
            jsonParser,
            RequireJsonContent,
            jsonValidate(UserSchema.resendVerifyEmailSchema),
            async (req, res, next) => {
                try {
                    let {lang} = req.headers
                    let {email, re_captcha} = req.body
                    let result = await this.ctrl.User.resendVerifyEmail({
                        email,
                        re_captcha,
                        remoteAddress: req.connection.remoteAddress,
                        lang,
                    })
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.post(
            '/verify-user',
            jsonParser,
            RequireJsonContent,
            jsonValidate(UserSchema.verifyUserSchema),
            async (req, res, next) => {
                try {
                    let {lang} = req.headers
                    let {email, user_id, number_verify, re_captcha} = req.body
                    let result = await this.ctrl.User.verifyUser({
                        email,
                        user_id,
                        number_verify,
                        re_captcha,
                        remoteAddress: req.connection.remoteAddress,
                        lang,
                    })
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.post('/new-access-token', jsonParser, RequireJsonContent, async (req, res, next) => {
            try {
                let {lang} = req.headers
                let {user_id, refresh_token, old_access_token} = req.body
                let result = await this.ctrl.User.newAccessToken({lang, user_id, refresh_token, old_access_token})
                return res.status(result.status).send(result.body)
            } catch (error) {
                console.log(error)
                next(error)
            }
        })

        this.router.post('/logout-all', jsonParser, RequireJsonContent, TokenAuthenticate, async (req, res, next) => {
            try {
                let {lang} = req.headers
                let token = req.headers['authorization']
                token = token.split(' ')[1]
                let {user} = req
                let result = await this.ctrl.User.logoutAll({user_id: user._id, token})
                return res.status(result.status).send(result.body)
            } catch (error) {
                console.log(error)
                next(error)
            }
        })
        this.router.post('/logout', jsonParser, RequireJsonContent, TokenAuthenticate, async (req, res, next) => {
            try {
                let {lang} = req.headers
                let token = req.headers['authorization']
                token = token.split(' ')[1]
                let {user} = req
                let result = await this.ctrl.User.logout({user_id: user._id, token, lang})
                await responseHandle(result, req, res)
            } catch (error) {
                next(error)
            }
        })

        this.router.post(
            '/upload-avatar',
            jsonParser,
            TokenAuthenticate,
            multer({limits: {fieldSize: 10 * 1024 * 1024}}).single('file'),
            async (req, res, next) => {
                try {
                    let result = await this.ctrl.User.uploadAvatar({req})
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.post(
            '/forgot-password',
            jsonParser,
            RequireJsonContent,
            jsonValidate(UserSchema.forgotPasswordSchema),
            async (req, res, next) => {
                try {
                    let {lang} = req.headers
                    let {email, re_captcha} = req.body
                    let result = await this.ctrl.User.forgotPassword({
                        email,
                        lang,
                        re_captcha,
                        remoteAddress: req.connection.remoteAddress,
                    })
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.post(
            '/confirm-forgot-password',
            jsonParser,
            RequireJsonContent,
            jsonValidate(UserSchema.confirmForgotPasswordSchema),
            async (req, res, next) => {
                try {
                    let {lang} = req.headers
                    let {user_id, number_verify, password, confirm_password, re_captcha} = req.body
                    let result = await this.ctrl.User.confirmForgotPassword({
                        user_id,
                        number_verify,
                        password,
                        confirm_password,
                        re_captcha,
                        remoteAddress: req.connection.remoteAddress,
                        lang,
                    })
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.get('/profile', jsonParser, RequireJsonContent, TokenAuthenticate, adminView, async (req, res, next) => {
            try {
                let {lang} = req.headers
                let {user} = req
                let result = await this.ctrl.User.getProfile({user, lang})
                await responseHandle(result, req, res)
            } catch (error) {
                next(error)
            }
        })

        this.router.put(
            '/profile/change-password',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            jsonValidate(UserSchema.changePasswordSchema),
            async (req, res, next) => {
                try {
                    let {lang} = req.headers
                    let {user} = req
                    let {new_password, confirm_new_password, old_password} = req.body
                    let result = await this.ctrl.User.changePassword({
                        user,
                        new_password,
                        confirm_new_password,
                        old_password,
                        lang,
                    })
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.put(
            '/profile/update-info',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            jsonValidate(UserSchema.updateInfoSchema),
            async (req, res, next) => {
                try {
                    let {lang} = req.headers
                    let {user} = req
                    let {name, country, birthday} = req.body
                    let result = await this.ctrl.User.updateInfo({user, name, country, birthday, lang})
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.post(
            '/search',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            jsonValidate(UserSchema.searchUserSchema),
            async (req, res, next) => {
                try {
                    let {lang} = req.headers
                    let {key_search} = req.body
                    let result = await this.ctrl.User.searchUser({key_search, lang})
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.put('/admin/list-user', jsonParser, RequireJsonContent, apiHandler(this.ctrl.User.getListUsers))
        this.router.get('/admin/user-details', jsonParser, RequireJsonContent, apiHandler(this.ctrl.User.getUserDetails))

        this.router.post('/request-register-phone', jsonParser, RequireJsonContent, TokenAuthenticate, async (req, res, next) => {
            try {
                const { user } = req;
                const { phone } = req.body
                let result = await this.ctrl.User.requestRegisterPhone({ user, phone })
                return responseHandle(result, req, res)

            } catch (error) {
                console.log(error)
                next(error)
            }
        })

        this.router.post('/submit-phone-verified', jsonParser, RequireJsonContent, TokenAuthenticate, async (req, res, next) => {
            try {
                const { user } = req;
                const { phone, uid } = req.body
                let result = await this.ctrl.User.submitPhoneVerified({ user, phone, uid })
                return responseHandle(result, req, res)

            } catch (error) {
                console.log(error)
                next(error)
            }
        })

        this.router.post('/request-contact', jsonParser, 
            RequireJsonContent, 
            apiHandler(this.ctrl.User.requestContact))
        this.router.get('/admin/request-contact', jsonParser, 
            RequireJsonContent, 
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.User.getRequestContact))
        this.router.put('/admin/request-contact', jsonParser, 
            RequireJsonContent, 
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.User.getRequestContact))
        this.router.put('/admin/update-request-contact', jsonParser, 
            RequireJsonContent, 
            TokenAuthenticate, 
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.User.updateRequestContact))
    }

    getRouter = () => {
        return this.router
    }
}

module.exports = User
