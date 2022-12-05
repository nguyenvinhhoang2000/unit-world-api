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
//utils
const {responseHandle} = require('../utils/response-handle.util')
const {apiHandler, apiFilesHandler} = require('../middleware/handler')

const {ProjectSchema} = require('../middleware/validate/index')

class Project {
    constructor(opts) {
        this.ctrl = opts.ctrl
        this.router = express.Router()

        this.router.get(
            '/',
            jsonParser,
            RequireJsonContent,
            jsonValidate(ProjectSchema.getProjects),
            apiHandler(this.ctrl.Project.getByAdmin),
        )
        this.router.get(
            '/project-types',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.Project.getProjectTypes),
        )
        this.router.post(
            '/search',
            jsonParser,
            RequireJsonContent,
            // jsonValidate(ProjectSchema.getProjects),
            apiHandler(this.ctrl.Project.get),
        )
        this.router.get(
            '/admin/get',
            jsonParser,
            RequireJsonContent,
            // jsonValidate(ProjectSchema.getProjectsByAdmin),
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN, ROLES.LEADER]),
            apiHandler(this.ctrl.Project.getByAdmin),
        )
        this.router.post(
            '/admin/upload-doc',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN, ROLES.LEADER]),
            multer({limits: {fieldSize: 3 * 1024 * 1024}}).single('file'),
            apiHandler(this.ctrl.Project.uploadProjectDoc),
        )
        this.router.post(
            '/admin/create',
            jsonParser,
            RequireJsonContent,
            jsonValidate(ProjectSchema.createProject),
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN], ROLES.LEADER),
            apiHandler(this.ctrl.Project.create),
        )
        this.router.post(
            '/admin/deploy',
            jsonParser,
            RequireJsonContent,
            jsonValidate(ProjectSchema.deployProject),
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN], ROLES.LEADER),
            apiHandler(this.ctrl.Project.deployProject),
        )
        this.router.put(
            '/admin/edit-project',
            jsonParser,
            RequireJsonContent,
            jsonValidate(ProjectSchema.editProjectOverview),
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN], ROLES.LEADER),
            apiHandler(this.ctrl.Project.editOverview),
        )
        this.router.delete(
            '/admin/delete-project',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN], ROLES.LEADER),
            apiHandler(this.ctrl.Project.deleteProject),
        )
        this.router.put(
            '/admin/edit-stock-info',
            jsonParser,
            RequireJsonContent,
            jsonValidate(ProjectSchema.editStockInfo),
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN], ROLES.LEADER),
            apiHandler(this.ctrl.Project.editStockInfo),
        )
        this.router.put(
            '/admin/update-avatar',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN], ROLES.LEADER),
            multer({limits: {fieldSize: 10 * 1024 * 1024}}).single('file'),
            apiFilesHandler(this.ctrl.Project.updateAvatar),
        )
        this.router.put(
            '/admin/update-project-info',
            jsonParser,
            RequireJsonContent,
            jsonValidate(ProjectSchema.updateProjectInfo),
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN], ROLES.LEADER),
            apiHandler(this.ctrl.Project.updateProjectInfo),
        )
        this.router.get(
            '/detail',
            jsonParser,
            RequireJsonContent,
            jsonValidate(ProjectSchema.detailsProject),
            apiHandler(this.ctrl.Project.detail),
        )

        this.router.post( // from admin
            '/admin/add-buyer-offer',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN], ROLES.LEADER),
            apiHandler(this.ctrl.ProjectContract.adminAddBuyerOffer),
        )

        this.router.put( // from admin
            '/admin/cancel-buyer-offer',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN], ROLES.LEADER),
            apiHandler(this.ctrl.ProjectContract.adminCancelBuyerOffer),
        )

        this.router.put( // from investor
            '/get-buyer-offer',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.ProjectContract.getBuyerOffer),
        )

        this.router.get( // from investor
            '/get-vote-history',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.ProjectContract.getVote),
        )

        this.router.post( // from investor
            '/vote-accept-offer',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.ProjectContract.voteAcceptOffer),
        )

        this.router.post( // from investor
            '/vote-reject-offer',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.ProjectContract.voteRejectOffer),
        )

        this.router.put( // from investor
            '/cancel-vote-offer',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.ProjectContract.cancelVoteOffer),
        )

        this.router.post( // from investor
            '/check-vote',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.ProjectContract.checkVote),
        )

        this.router.get( // from investor
            '/get-unclaimed',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.ProjectContract.checkUnclaimed),
        )

        this.router.put( // from admin
            '/admin/distribute-project',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN], ROLES.LEADER),
            apiHandler(this.ctrl.ProjectContract.adminDistributeProject),
        )

        this.router.post(
            '/claim-reward',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.ProjectContract.claimReward),
        )

        this.router.get(
            '/get-claim-history',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            apiHandler(this.ctrl.ProjectContract.getClaimReward),
        )

        this.router.post( // from admin
            '/admin/refund-project',
            jsonParser,
            RequireJsonContent,
            TokenAuthenticate,
            roleAuthorize([ROLES.ADMIN], ROLES.LEADER),
            apiHandler(this.ctrl.ProjectContract.adminRefundProject),
        )
    }

    getRouter = () => {
        return this.router
    }
}

module.exports = Project
