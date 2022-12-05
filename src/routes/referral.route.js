const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const jsonParser = bodyParser.json()
const {roleAuthorize, ROLES, adminView} = require('../middleware/role-authenticate')

//middleware
const TokenAuthenticate = require('../middleware/authenticate')
const RequireJsonContent = require('../middleware/json-content')
const {jsonValidate} = require('../middleware/json-validate')
//utils
const {responseHandle} = require('../utils/response-handle.util')
const { apiHandler } = require('../middleware/handler')

class Referral {
    constructor(opts) {
        this.ctrl = opts.ctrl
        this.router = express.Router()

        this.router.get('/get', 
            jsonParser, 
            RequireJsonContent, 
            TokenAuthenticate, 
            adminView,
            async (req, res, next) => {
            try {
                const {user} = req

                let result = await this.ctrl.Ref.get(user)
                await responseHandle(result, req, res)
            } catch (error) {
                next(error)
            }
        })

        this.router.put(
            '/list-referrals',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            adminView,
            apiHandler(this.ctrl.Ref.listReferrals)
        )

        this.router.post('/reward', jsonParser, RequireJsonContent, TokenAuthenticate, roleAuthorize(ROLES.ADMIN), async (req, res, next) => {
            // TODO: filter role admin only
            try {
                const {userId, amount, note} = req.body

                let result = await this.ctrl.Ref.reward({userId, amount: parseFloat(amount)})
                await responseHandle(result, req, res)
            } catch (error) {
                next(error)
            }
        })

        this.router.put(
            '/admin-statistic',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            async (req, res, next) => {
                // TODO: filter role admin only
                try {
                    const {filter} = req.body

                    let result = await this.ctrl.Ref.adminRewardStatistic({filter})
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.post(
            '/admin-reward-history',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            async (req, res, next) => {
                // TODO: filter role admin only
                try {
                    const {search, filter, sort, page, limit} = req.body

                    let result = await this.ctrl.Ref.rewardHistory({
                        search,
                        filter,
                        sort,
                        page: page || 1,
                        limit: limit || 100,
                    })
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.get(
            '/reward-history',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            adminView,
            async (req, res, next) => {
                // TODO: filter role admin only
                try {
                    const {search, filter, sort, page, limit} = req.body
                    const {user} = req

                    let result = await this.ctrl.Ref.rewardHistory({
                        userId: user._id,
                        search,
                        filter,
                        sort,
                        page: page || 1,
                        limit: limit || 100,
                    })
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )

        this.router.post(
            '/set-reward-config',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            async (req, res, next) => {
                // TODO: filter role admin only
                try {
                    const {registration, ido_investment} = req.body

                    let result = await this.ctrl.Ref.setReferralConfig({registration, ido_investment})
                    await responseHandle(result, req, res)
                } catch (error) {
                    next(error)
                }
            },
        )
    }

    getRouter = () => {
        return this.router
    }
}

module.exports = Referral
