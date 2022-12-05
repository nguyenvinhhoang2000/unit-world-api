'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const market = new Schema(
    {
        market: {
            type: String,
            required: true,
            default: CONSTANTS.Market.MARKET.P2P,
            enum: Object.values(CONSTANTS.Market.MARKET),
        },
        pair: {
            asset: {
                type: String,
                required: true,
                enum: Object.values(CONSTANTS.Market.SYMBOL),
            },
            base: {
                type: String,
                required: true,
                enum: Object.values(CONSTANTS.Market.SYMBOL),
            },
        },
        fee: {
            taker: {
                type: Number,
                default: 0,
            },
            maker: {
                type: Number,
                default: 0,
            },
        },
        limit: {
            minimum: {
                type: Number,
                default: 0,
            },
            maximum: {
                type: Number,
                default: -1,
            },
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    {timestamps: true},
)

const Market = mongoose.model('Market', market)

module.exports = Market
