const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const jsonParser = bodyParser.json()

//middleware
const TokenAuthenticate = require('../middleware/authenticate')
const RequireJsonContent = require('../middleware/json-content')
const {jsonValidate} = require('../middleware/json-validate')
const {roleAuthorize, adminView} = require('../middleware/role-authenticate')
const EntityConst = require('../constants/entity.constant')
const ROLES = EntityConst.USER.ROLES
//utils
const {responseHandle} = require('../utils/response-handle.util')
const {apiHandler, apiFilesHandler} = require('../middleware/handler')
const {mustKyc, validateTfa} = require('../middleware/kyc')

const {ProjectSchema} = require('../middleware/validate/index')

class Market {
    constructor(opts) {
        this.ctrl = opts.ctrl
        this.router = express.Router()

        this.router.get(
            '/ido/history',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            adminView,
            apiHandler(this.ctrl.Market.getHistory),
        )
        this.router.get('/ido/orders', jsonParser, RequireJsonContent, apiHandler(this.ctrl.Market.getOrders))
        this.router.post(
            '/ido/fulfill',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Market.fulfillOrder),
        )
        this.router.put(
            '/ido/add-whitelist',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Market.addWhitelist),
        )

        this.router.put(
            '/swap/edit-orders',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Market.editOrders),
        )
        this.router.get('/swap/orders', jsonParser, RequireJsonContent, apiHandler(this.ctrl.Market.getOrders))
        this.router.get(
            '/swap/history',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            adminView,
            apiHandler(this.ctrl.Market.getHistory),
        )
        this.router.post(
            '/swap/fulfill',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Market.fulfillOrder),
        )

        this.router.put('/p2p/order-book', jsonParser, RequireJsonContent, apiHandler(this.ctrl.Market.getOrders))
        this.router.post(
            '/p2p/place-order-book',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Market.placeOrder),
        )
        this.router.put(
            '/p2p/history',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            adminView,
            apiHandler(this.ctrl.Market.getHistory),
        )
        this.router.put(
            '/p2p/edit-order-book',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Market.editOrders),
        )
        this.router.post(
            '/p2p/fulfill',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Market.fulfillOrder),
        )

        this.router.put(
            '/p2p/cancel-order-book',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Market.cancelOrderBook),
        )

        this.router.put(
            '/p2p/mark-send-fiat',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Market.markSendFiat),
        )

        this.router.put(
            '/p2p/mark-receive-fiat',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Market.markReceiveFiat),
        )


        // market configuration
        this.router.get(
            '/config',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Market.getConfig),
        )
        this.router.put(
            '/config/:id',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Market.updateConfig),
        )
    }

    getRouter = () => {
        return this.router
    }
}

module.exports = Market
