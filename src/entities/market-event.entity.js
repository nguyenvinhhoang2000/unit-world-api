'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const marketEvent = new Schema(
    {
        txId: {
            type: String,
            required: true,
        },
        log_id: {
            type: String,
            unique: true,
            required: true,
            index: true,
        },
        blockNumber: {
            type: Number,
            required: true,
        },
        type: {
            type: Number,
            enum: Object.values(CONSTANTS.EntityConst.MARKET.EVENT.TYPE),
            required: true,
        },
        dataEvent: {
            type: Object,
            required: true,
        },
        version: {
            type: Number,
            default: 1,
        },
        addInfo: {
            type: String,
        },
    },
    {timestamps: true},
)

const MarketEvent = mongoose.model('MarketEvent', marketEvent)

module.exports = MarketEvent
