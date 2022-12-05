const express = require('express')
const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

//middleware
const TokenAuthenticate = require('../middleware/authenticate')
const RequireJsonContent = require('../middleware/json-content')
const {jsonValidate} = require('../middleware/json-validate')
const {roleAuthorize} = require('../middleware/role-authenticate')
const EntityConst = require('../constants/entity.constant')
const ROLES = EntityConst.USER.ROLES

//utils
const {responseHandle} = require('../utils/response-handle.util')
const {apiHandler, apiFilesHandler} = require('../middleware/handler')

const {RankSchema} = require('../middleware/validate/index')

class Rank {
    constructor(opts) {
        this.ctrl = opts.ctrl
        this.router = express.Router()

        this.router.post(
            '/admin/create',
            jsonParser,
            RequireJsonContent,
            jsonValidate(RankSchema.createRank),
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Rank.create),
        ),

        this.router.put(
            '/admin/update',
            jsonParser,
            RequireJsonContent,
            jsonValidate(RankSchema.updateRank),
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Rank.updateRank),
        )

        this.router.get(
            '/admin/get',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Rank.getByAdmin),
        )

        this.router.delete(
            '/admin/delete',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Rank.deleteRank),
        )
        this.router.get(
            '/detail',
            jsonParser,
            RequireJsonContent,
            jsonValidate(RankSchema.detailRank),
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Rank.getDetailById),
        )
    }

    getRouter = () => {
        return this.router
    }
}

module.exports = Rank
