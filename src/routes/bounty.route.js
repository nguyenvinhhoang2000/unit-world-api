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

class Bounty {
    constructor(opts) {
        this.ctrl = opts.ctrl
        this.router = express.Router()

        this.router.post(
            '/admin/create-program',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Bounty.adminCreateProgram),
        )


        this.router.put(
            '/get-program',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Bounty.getProgram),
        )

        this.router.put(
            '/admin/update-program/:programId',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Bounty.adminUpdateProgram),
        )

        this.router.post(
            '/new-program-completion',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Bounty.newProgramCompletion),
        )

        this.router.put(
            '/get-program-completion',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            adminView,
            apiHandler(this.ctrl.Bounty.getProgramCompletion),
        )


        this.router.get(
            '/get-program-completion/:id',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            adminView,
            apiHandler(this.ctrl.Bounty.getProgramCompletionDetail),
        )

        this.router.put(
            '/requesst-program-completion-reward',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Bounty.requesProgramCompletionReward),
        )

        this.router.put(
            '/admin/confirm-program-completion',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN]),
            apiHandler(this.ctrl.Bounty.adminConfirmProgramCompletion),
        )
    }

    getRouter = () => {
        return this.router
    }
}

module.exports = Bounty
