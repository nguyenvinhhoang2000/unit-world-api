const Joi = require('joi')
const CONSTANTS = require('../../constants/entity.constant')

exports.BankAccountSchema = Joi.object({
    bank_type: Joi.string()
        .valid(...Object.values(CONSTANTS.BANK_ACCOUNT.BANK_TYPE))
        .required(),
    number_card: Joi.string().trim().pattern(new RegExp('^[0-9]{4,20}$')).required(),
    full_name: Joi.string().trim().pattern(new RegExp('^[a-zA-Z ]{3,50}$')).required(),
    bank_branch: Joi.string().max(50).allow(null, ''),
})

exports.ListWithdrawDepsositSchema = Joi.object({})
