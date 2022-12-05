'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const transactionLog = new Schema(
    {
        type: {
            type: String,
            enum: Object.values(CONSTANTS.EntityConst.TRANSACTION.TYPE),
            required: true,
        },
        amount: {
            //só lượng token
            type: Number,
        },
        currency: {
            type: String,
            enum: Object.values(CONSTANTS.EntityConst.TRANSACTION.CURRENCY),
            required: true,
        },
        from: {
            // deposit|reward -> null;
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        to: {
            // withdraw|fee -> null
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(CONSTANTS.EntityConst.TRANSACTION.STATUS),
            default: CONSTANTS.EntityConst.TRANSACTION.STATUS.PENDING,
        },
        note: {
            type: String,
        },
    },
    {timestamps: true},
)

const TransactionLog = mongoose.model('TransactionLog', transactionLog)

module.exports = TransactionLog
