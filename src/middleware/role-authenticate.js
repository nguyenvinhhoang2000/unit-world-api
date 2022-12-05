const HttpStatus = require('http-status-codes')
const ROLE = require('../constants/entity.constant')
const UserEntity = require('../entities/user.entity')
const { RestError } = require('../utils')

function roleAuthorize(roles = []) {
    if (typeof roles === 'string') {
        roles = [roles]
    }

    return (req, res, next) => {
        let user = req.user
        if (user.role == ROLE.USER.ROLES.ADMIN) {
            return next()
        }
        if (roles.length && !roles.includes(user.role)) {
            // user's role is not authorized
            return res.status(HttpStatus.UNAUTHORIZED).json({message: 'No permission!'})
        }

        // authentication and authorization successful
        next()
    }
}

const adminView = async (req, res, next) => {
    try {
        let user = req.user
        let asUser = req.headers['as_user']
        if (user.role == ROLE.USER.ROLES.ADMIN && asUser) {
            console.log(`[Role] admin view as user ${asUser}`)
            if(asUser == 'all') {
                req.query.asUser = 'all'
            } else {
                req.user = await UserEntity.findOne({
                    _id: asUser
                })
                if(!req.user) {
                    throw RestError.NewBadRequestError(`Not found user ${asUser}`)
                }
            }
        }
        next()
    } catch (error) {
        return res.status(HttpStatus.PRECONDITION_REQUIRED).json({message: error.message})
    }
}

const adminAccountingView = async (req, res, next) => {
    try {
        let user = req.user
        let asUser = req.headers['as_user']
        if ((user.role == ROLE.USER.ROLES.ADMIN || user.role == ROLE.USER.ROLES.ACCOUNTING) && asUser) {
            console.log(`[Role] admin/accounting view as user ${asUser}`)
            req.user = await UserEntity.findOne({
                _id: asUser
            })
            if(!req.user) {
                throw RestError.NewBadRequestError(`Not found user ${asUser}`)
            }
        }
        next()
    } catch (error) {
        return res.status(HttpStatus.PRECONDITION_REQUIRED).json({message: error.message})
    }
}


module.exports = {
    roleAuthorize,
    ROLES: ROLE.USER.ROLES,
    adminView,
    adminAccountingView
}
