const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const jsonParser = bodyParser.json()

//middleware
const TokenAuthenticate = require('../middleware/authenticate')
const RequireJsonContent = require('../middleware/json-content')
const {jsonValidate} = require('../middleware/json-validate')
const RoleAuthenticate = require('../middleware/role-authenticate')
const EntityConst = require('../constants/entity.constant')
const ROLES = EntityConst.USER.ROLES
//utils
const {responseHandle} = require('../utils/response-handle.util')

class Stock {
    constructor(opts) {
        this.ctrl = opts.ctrl
        this.router = express.Router()
    }

    getRouter = () => {
        return this.router
    }
}

module.exports = Stock
