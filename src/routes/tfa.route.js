const express = require('express')
const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

//middleware
const TokenAuthenticate = require('../middleware/authenticate')
const RequireJsonContent = require('../middleware/json-content')
class Tfa {
    constructor(opts) {
        this.ctrl = opts.ctrl
        this.router = express.Router()

        this.router.post('/generate', jsonParser, RequireJsonContent, TokenAuthenticate, async (req, res, next) => {
            try {
                let {user} = req
                let result = await this.ctrl.Tfa.generate({user})
                return res.status(result.status).send(result.body)
            } catch (error) {
                console.log(error)
                next(error)
            }
        })

        this.router.post('/active', jsonParser, RequireJsonContent, TokenAuthenticate, async (req, res, next) => {
            try {
                let {user} = req
                let {token} = req.body
                let result = await this.ctrl.Tfa.active({user, token})
                return res.status(result.status).send(result.body)
            } catch (error) {
                console.log(error)
                next(error)
            }
        })

        this.router.post('/deactive', jsonParser, RequireJsonContent, TokenAuthenticate, async (req, res, next) => {
            try {
                let {user} = req
                let {token} = req.body
                let result = await this.ctrl.Tfa.deactive({user, token})
                return res.status(result.status).send(result.body)
            } catch (error) {
                console.log(error)
                next(error)
            }
        })
    }

    getRouter = () => {
        return this.router
    }
}

module.exports = Tfa
