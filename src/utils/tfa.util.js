const speakeasy = require('speakeasy')
const RestError = require('./error.util')
const Math = require('./math.util')
const Email = require('./email.util')
const CONSTANTS = require('../constants')
const {CacheService} = require('../services/cache')

const verify2FA = (model) => async({userId, code}) => {
    //Check TFA
    let tfa = await model.findOne({user: userId})
    //If user  enable tfa
    if (tfa && tfa.status === CONSTANTS.EntityConst.TFA.ACTIVE) {
        if (code) {
            const check = speakeasy.totp.verify({
                secret: tfa.secret,
                encoding: 'base32',
                token: code,
                window: 0,
            })
            console.log(`2fa===> `, check)

            //input token expires
            if (!check) {
                throw RestError.NewNotAcceptableError('The 2Fa code is incorrect!', 1005)
            }
        } else {
            return ResponseFormat.formatResponse(200, 'You must enter your 2FA code!', null, 202)
        }
    } else {
        throw RestError.NewNotAcceptableError('The 2Fa code was disabled unexpectedly!', 1005)
    }
}

const isEnabled = (model) => async(userId) => {
    //Check TFA
    let tfa = await model.findOne({user: userId})
    //If user  enable tfa
    if (tfa && tfa.status === CONSTANTS.EntityConst.TFA.ACTIVE) {
        return true
    }
    return false
}

const generate2FaCache = (model) => async(user, id) => {
    const numberVerify = Math.generateCheckNumber()
    console.log(`verify number: ${numberVerify}`)

    let type = null
    const tfaEnabled = await isEnabled(model)(user._id)
    if(!tfaEnabled) {
        //send email if TFA not enabled
        console.log(`[Wallet] Send withdrawal verification code to ${user.email}`)
        await CacheService.set(`${CONSTANTS.UtilsConst.TFA_VERIFICATION}:${user._id}:${id}`, `${numberVerify}`, 120) // expire after 120 seconds
        Email.sendEmail(user.email, numberVerify)
        type = 'email'
    } else {
        await CacheService.set(`${CONSTANTS.UtilsConst.TFA_VERIFICATION}:${user._id}:${id}`, '2fa', 120) // expire after 120 seconds
        type = '2fa'
    }

    return type
}

const verify2FaCache = (model) => async(user, id, input) => {
    const code = await CacheService.get(`${CONSTANTS.UtilsConst.TFA_VERIFICATION}:${user._id}:${id}`)
    if(!code) {
        throw RestError.NewInvalidInputError(`2FA code was expired!`)
    }

    if(code == '2fa') {
        await verify2FA(model)({userId: user.id, code: input})
        await CacheService.del(`${CONSTANTS.UtilsConst.TFA_VERIFICATION}:${user._id}:${id}`)
    } else {
        if(input.trim() != code.trim()) {
            throw RestError.NewInvalidInputError(`2FA code is invalid!`)
        }
        await CacheService.del(`${CONSTANTS.UtilsConst.TFA_VERIFICATION}:${user._id}:${id}`)
    }
}

const clear2FaCache = (model) => async(user, id) => {
    return await CacheService.del(`${CONSTANTS.UtilsConst.TFA_VERIFICATION}:${user._id}:${id}`)
}

module.exports = {
    isEnabled,
    verify2FA,
    generate2FaCache,
    verify2FaCache,
    clear2FaCache
}