'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const transaction = new Schema(
    {
        tx_id: {
            type: String,
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        gateway: {
            type: String,
            enum: Object.values(CONSTANTS.EntityConst.TRANSACTION.GATEWAY),
            required: true,
        },
        type: {
            type: String,
            enum: Object.values(CONSTANTS.EntityConst.TRANSACTION.TYPE),
            required: true,
        },
        amount: {
            //só lượng coin
            type: Number,
            min: 0,
        },
        currency: {
            symbol: {
                type: String,
            },
            token_address: {
                type: String,
            },
            decimal: {
                type: Number,
            },
        },
        rate_price: {
            //tỉ lê vs 1 usdt
            type: Number,
            min: 0,
        },
        from: {
            type: String,
        },
        to: {
            type: String,
        },
        fee: {
            type: Number,
            default: 0,
        },
        no: {
            type: String,
            default: 0,
        },
        verification_code: {
            type: String,
            default: 0,
        },
        status: {
            type: String,
            enum: Object.values(CONSTANTS.EntityConst.TRANSACTION.STATUS),
            default: CONSTANTS.EntityConst.TRANSACTION.STATUS.PENDING,
        },
        add_info: {
            type: String,
        },
        is_collected: {
            type: Boolean,
            default: false,
        },
    },
    {timestamps: true},
)

const Transaction = mongoose.model('Transaction', transaction)

module.exports = Transaction
