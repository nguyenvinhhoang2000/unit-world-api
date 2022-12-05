const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const jsonParser = bodyParser.json()

//middleware
const TokenAuthenticate = require('../middleware/authenticate')
const RequireJsonContent = require('../middleware/json-content')
const {jsonValidate} = require('../middleware/json-validate')
const {roleAuthorize} = require('../middleware/role-authenticate')
const EntityConst = require('../constants/entity.constant')
const ROLES = EntityConst.USER.ROLES
const {apiHandler} = require('../middleware/handler')
//utils
const {responseHandle} = require('../utils/response-handle.util')

class Stake {
    constructor(opts) {
        this.ctrl = opts.ctrl
        this.router = express.Router()
        
        this.router.post('/packages/create', jsonParser, RequireJsonContent, TokenAuthenticate, roleAuthorize([ROLES.ADMIN]), apiHandler(this.ctrl.Stake.createStakePackage))
        this.router.put('/packages/update', jsonParser, RequireJsonContent, TokenAuthenticate, roleAuthorize([ROLES.ADMIN]), apiHandler(this.ctrl.Stake.updateStakePackage))
        this.router.get('/packages/detail', jsonParser, RequireJsonContent, TokenAuthenticate, apiHandler(this.ctrl.Stake.getDetailStakePackage))
        this.router.get('/packages/list', jsonParser, RequireJsonContent, TokenAuthenticate, apiHandler(this.ctrl.Stake.getListStakePackage))
        this.router.delete('/packages/delete', jsonParser, RequireJsonContent, TokenAuthenticate, roleAuthorize([ROLES.ADMIN]), apiHandler(this.ctrl.Stake.deleteStakePackage))

        this.router.post('/staking', jsonParser, RequireJsonContent, TokenAuthenticate, roleAuthorize([ROLES.USER]), apiHandler(this.ctrl.Stake.staking))
        this.router.post('/unstaking', jsonParser, RequireJsonContent, TokenAuthenticate, roleAuthorize([ROLES.USER]), apiHandler(this.ctrl.Stake.unStaking))
        this.router.post('/claim', jsonParser, RequireJsonContent, TokenAuthenticate, roleAuthorize([ROLES.USER]), apiHandler(this.ctrl.Stake.claimStakingReward))
        this.router.get('/my-staking', jsonParser, RequireJsonContent, TokenAuthenticate, roleAuthorize([ROLES.USER]), apiHandler(this.ctrl.Stake.getMyStakePackages))
        this.router.get('/my-staking-by-admin', jsonParser, RequireJsonContent, TokenAuthenticate, roleAuthorize([ROLES.ADMIN]), apiHandler(this.ctrl.Stake.getMyStakePackagesByAdmin))


    }


    getRouter = () => {
        return this.router
    }
}

module.exports = Stake
