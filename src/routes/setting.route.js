const express = require('express')
const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

//middleware
const TokenAuthenticate = require('../middleware/authenticate')
const RequireJsonContent = require('../middleware/json-content')
const {joiValidate} = require('../middleware/json-validate')
const {apiHandler} = require('../middleware/handler')
const {roleAuthorize, ROLES} = require('../middleware/role-authenticate')

class Setting {
    constructor(opts) {
        this.ctrl = opts.ctrl
        this.router = express.Router()

        // Owner wallet - require owner role
        this.router.post(
            '/add-owner-wallet',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Setting.addOwnerWallet),
        )
        this.router.get(
            '/list-owner-wallet',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Setting.listOwnerWallet),
        )

        // Block scan setting
        this.router.get(
            '/get-block-confirmation',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Setting.getBlockConfirmation),
        )
        this.router.put(
            '/set-block-confirmation',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Setting.setBlockConfirmation),
        )

        // Referral rule - require admin role
        this.router.post(
            '/set-referral-rule',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(null),
        )
    }

    getRouter = () => {
        return this.router
    }
}

module.exports = Setting
