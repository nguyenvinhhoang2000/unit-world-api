let jwt = require('jsonwebtoken')
const HttpStatus = require('http-status-codes')
const CONSTANTS = require('../constants')
const UserEntity = require('../entities/user.entity')
const Utils = require('../utils')
const fs = require('fs')
var publicKEY = fs.readFileSync(`src/keys/public-${process.env.MODE}.key`, 'utf8')

const authorization = async (req, res, next) => {
    try {
        let token = req.headers['authorization']
        token = token.split(' ')[1]
        if (token) {
            jwt.verify(
                token,
                publicKEY,
                {algorithms: CONSTANTS.UtilsConst.ENCRYPT_ALGORITHMS},
                async (err, payload) => {
                    if (err) {
                        // console.log(err)
                        return res.status(HttpStatus.UNAUTHORIZED).send({msg: 'Token expired'})
                    }
                    // console.log(`payload = `, payload)

                    //check in blacklist token
                    const blacklistTokens = await Utils.Redis.getDataBlacklistTokens(payload.user_id)

                    if (blacklistTokens && blacklistTokens.includes(token)) {
                        return res.status(HttpStatus.UNAUTHORIZED).send({
                            success: false,
                            message: 'User is logged out.',
                        })
                    }
                    // req.payload = payload
                    const user = await UserEntity.findOne({
                        _id: payload.user_id,
                    })

                    if (!user) return res.status(HttpStatus.UNAUTHORIZED).send({msg: 'Token incorrect'})
                    if (user.status != CONSTANTS.EntityConst.USER.STATUS.COMPLETED)
                        return res.status(HttpStatus.UNAUTHORIZED).send({msg: 'user inactive'})
                    req.user = user

                    //write log action
                    // await _writeLogAction(req)

                    next()
                },
            )
        } else {
            // return Promise.reject('Token incorrect')
            // console.log(`here = `)
            return res.status(HttpStatus.UNAUTHORIZED).send({msg: 'Token incorrect'})
        }
    } catch (error) {
        console.log(error)
        return res.status(HttpStatus.UNAUTHORIZED).send({msg: 'Token is required'})
    }
}

module.exports = authorization
