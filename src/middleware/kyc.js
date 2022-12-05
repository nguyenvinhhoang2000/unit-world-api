const KycEntity = require('../entities/kyc.entity')
const TfaEntity = require('../entities/tfa.entity')

const {EntityConst} = require('../constants')
const HttpStatus = require('http-status-codes')
const {Tfa, RestError} = require('../utils')

exports.mustKyc = async (req, res, next) => {
    try {
        const {user} = req

        const kyc = await KycEntity.findOne({user: user._id}).select('status').lean()
        if (!kyc || kyc.status != EntityConst.KYC.STATUS.COMPLETED) {
            throw new Error('KYC_REQUIRED')
        }
        next()
    } catch (error) {
        return res.status(HttpStatus.PRECONDITION_REQUIRED).json({message: error.message})
    }
}

exports.validateTfa = async (req, res, next) => {
    try {
        const {user} = req
        const {tfaCode} = req.headers

        const isEnabled = await Tfa.isEnabled(TfaEntity)(user._id)
        if (isEnabled) {
            if(!tfaCode) throw RestError.NewForbiddenError('Need to provide 2FA code')
            const verified = await Tfa.verify2FA(TfaEntity)({
                userId: user._id,
                code: tfaCode
            })
            if(!verified) throw RestError.NewForbiddenError('2FA code is incorrect')
        } else {
            console.log(`TFA is not enabled`)
        }
        next()
    } catch (error) {
        return res.status(HttpStatus.PRECONDITION_REQUIRED).json({message: error.message})
    }
}
