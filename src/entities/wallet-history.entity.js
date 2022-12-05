'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const wallet = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        currency: {
            type: String
        },
        credit: {
            type: String
        },
        amount: {
            type: Number
        },
        action: {
            type: String
        },
        actionId: {
            type: String
        },
        note: {
            type: String
        },
        status: {
            type: String
        },
    },
    {timestamps: true},
)

const WalletHistory = mongoose.model('WalletHistory', wallet)

module.exports = WalletHistory
