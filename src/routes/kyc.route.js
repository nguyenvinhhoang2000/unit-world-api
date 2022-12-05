const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const jsonParser = bodyParser.json()

//middleware
const TokenAuthenticate = require('../middleware/authenticate')
const RequireJsonContent = require('../middleware/json-content')
const {jsonValidate} = require('../middleware/json-validate')
const {roleAuthorize, ROLES, adminView} = require('../middleware/role-authenticate')
//utils
const {responseHandle} = require('../utils/response-handle.util')

class Kyc {
    constructor(opts) {
        this.ctrl = opts.ctrl
        this.router = express.Router()

        this.router.post(
            '/upload-doc',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            multer({limits: {fieldSize: 3 * 1024 * 1024}}).single('file'),
            async (req, res, next) => {
                try {
                    const file = req.file
                    const {type, side, additional} = req.query
                    const {user} = req
                    const result = await this.ctrl.Kyc.uploadDoc({file, type, side, user, additional})
                    console.log({result})
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.post('/update-info', jsonParser, RequireJsonContent, TokenAuthenticate, async (req, res, next) => {
            try {
                let {name, phone, birthday, gender, add_info, country} = req.body
                const {user} = req

                let result = await this.ctrl.Kyc.updateGeneralInfo({
                    user,
                    name,
                    phone,
                    birthday,
                    gender,
                    add_info,
                    country,
                })
                await responseHandle(result, req, res)
            } catch (error) {
                next(error)
            }
        })

        this.router.post(
            '/admin-confirm',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN, ROLES.ACCOUNTING]),
            async (req, res, next) => {
                // TODO filter role admin only
                try {
                    const {user} = req
                    let {step, note} = req.query
                    const {userId, side} = req.body
                    if (!step) step = req.body.step
                    if (!note) note = req.body.note

                    let result = await this.ctrl.Kyc.adminConfirm(userId, `step_${step}`, note, side)
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.post(
            '/admin-reject',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN, ROLES.ACCOUNTING]),
            async (req, res, next) => {
                // TODO filter role admin only
                try {
                    const {user} = req
                    let {step, note} = req.query
                    const {userId, side} = req.body
                    if (!step) step = req.body.step
                    if (!note) note = req.body.note

                    let result = await this.ctrl.Kyc.adminReject(userId, `step_${step}`, note, side)
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.get(
            '/admin-list',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN, ROLES.ACCOUNTING]),
            async (req, res, next) => {
                try {
                    const {limit, page, status, search, sortBy, sortDirection} = req.query
                    let result = await this.ctrl.Kyc.adminList({limit, page, status, search, sortBy, sortDirection})
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.get(
            '/admin-get',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN, ROLES.ACCOUNTING]),
            async (req, res, next) => {
                try {
                    const {userId} = req.query
                    let result = await this.ctrl.Kyc.get(userId, true)
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.get('/get', jsonParser, RequireJsonContent, TokenAuthenticate, adminView, async (req, res, next) => {
            try {
                const {user} = req

                let result = await this.ctrl.Kyc.get(user)
                await responseHandle(result, req, res)
            } catch (error) {
                next(error)
            }
        })

        this.router.get('/address', jsonParser, RequireJsonContent, TokenAuthenticate, async (req, res, next) => {
            try {
                const {province, district} = req.query
                let result = await this.ctrl.Kyc.address(province, district)
                await responseHandle(result, req, res)
            } catch (error) {
                next(error)
            }
        })
    }

    getRouter = () => {
        return this.router
    }
}

module.exports = Kyc
