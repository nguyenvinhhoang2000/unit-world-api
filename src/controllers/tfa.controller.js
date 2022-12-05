const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const Uuid = require('uuid').v4
const util = require('util')
//util
const Utils = require('../utils')
const CONSTANTS = require('../constants')
const {RestError, ResponseFormat} = require('../utils')

class Tfa {
    constructor(opts) {
        this.model = opts.model
    }

    generate = async ({user}) => {
        try {
            let secret = null
            let path = null
            let stringQR = null

            let secretData = await this.model.Tfa.findOne({user: user._id})
            if (secretData) {
                secret = secretData.secret
                stringQR = secretData.path
                path = await QRCode.toDataURL(stringQR)
                return ResponseFormat.formatResponse(200, 'OK', {
                    path: path,
                    stringQR: secret,
                    remaining: 30 - Math.floor((new Date().getTime() / 1000.0) % 30),
                })
            }
            secretData = speakeasy.generateSecret({length: 20, name: `Quesera(${user.email})`})
            secret = secretData.base32
            QRCode.toDataURL = util.promisify(QRCode.toDataURL)
            stringQR = secretData.otpauth_url
            path = await QRCode.toDataURL(secretData.otpauth_url)
            const tfa = await this.model.Tfa.create({
                user: user._id,
                secret: secret,
                path: stringQR,
            })
            if (tfa) {
                return ResponseFormat.formatResponse(
                    200,
                    'Created',
                    {
                        path: path,
                        stringQR: secret,
                        remaining: 30 - Math.floor((new Date().getTime() / 1000.0) % 30),
                    },
                    2,
                )
            } else {
                throw RestError.NewBadRequestError('Creating 2FA code is failed')
            }
        } catch (error) {
            throw error
        }
    }

    active = async ({user, token}) => {
        try {
            let secretData = await this.model.Tfa.findOne({user: user._id})
            // console.log(`secretData = `, secretData)
            if (secretData.status == CONSTANTS.EntityConst.TFA.ACTIVE) {
                throw RestError.NewNotAcceptableError('2FA code has been already activated')
            }
            const check = speakeasy.totp.verify({
                secret: secretData.secret,
                encoding: 'base32',
                token: token,
                window: 0,
            })
            console.log(`check 2fa = `, check)
            if (check) {
                await this.model.Tfa.findOneAndUpdate({user: user._id}, {status: CONSTANTS.EntityConst.TFA.ACTIVE})
                return ResponseFormat.formatResponse(200, 'Activate 2FA code successfully')
            } else {
                throw RestError.NewBadRequestError('Activation code is incorrect')
            }
        } catch (error) {
            throw error
        }
    }

    deactive = async ({user, token}) => {
        try {
            let secret = await this.model.Tfa.findOne({user: user._id})
            if (secret.status == CONSTANTS.EntityConst.TFA.INACTIVE) {
                throw RestError.NewBadRequestError('Your 2FA code has been already deactivated')
            }

            const check = speakeasy.totp.verify({
                secret: secret.secret,
                encoding: 'base32',
                token: token,
                window: 0,
            })
            if (check) {
                await this.model.Tfa.findOneAndUpdate({user: user._id}, {status: CONSTANTS.EntityConst.TFA.INACTIVE})
                return ResponseFormat.formatResponse(200, 'Deactivate 2FA code successfully')
            } else {
                throw RestError.NewBadRequestError('Activation code is incorrect')
            }
        } catch (error) {
            throw error
        }
    }
}

module.exports = Tfa
