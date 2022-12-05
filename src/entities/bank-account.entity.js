'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const EntityConst = require('../constants/entity.constant')
const bankAccount = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            unum: Object.values(EntityConst.BANK_ACCOUNT.TYPE),
        },
        bank_type: {
            type: String,
            enum: Object.values(EntityConst.BANK_ACCOUNT.BANK_TYPE),
            required: true,
        },
        number_card: {
            type: String,
            required: true,
        },
        full_name: {
            type: String,
            required: true,
        },
        bank_branch: {
            type: String,
        },
        inactive: {
            type: Boolean,
            default: false
        }
    },
    {timestamps: true},
)

const BankAccount = mongoose.model('BankAccount', bankAccount)

module.exports = BankAccount
