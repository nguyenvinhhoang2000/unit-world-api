'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const EntityConst = require('../constants/entity.constant')
const CONSTANTS = require('../constants')

const order = new Schema(
    {
        order_no: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        market: {
            type: Schema.Types.ObjectId,
            ref: 'Market',
            required: true,
        },
        symbol: {
            type: String,
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        orderbook: {
            type: Schema.Types.ObjectId,
            ref: 'OrderBook',
        },
        type: {
            type: String,
            required: true,
            enum: Object.values(CONSTANTS.Market.ORDER),
        },
        price: {
            type: Number,
            min: 0,
        },
        gas: {
            type: Number,
            default: 0,
        },
        quantity: {
            //tổng số lượng
            type: Number,
            min: 0,
        },
        charging_method: {
            type: String,
            default: 'built-in', // or 'manual' for self transfer vnd if wallet is not enough money
        },
        msg: {
            type: String,
        },
        bank_statement: {
            type: String,
        },
        status: {
            type: String,
            enum: Object.values(CONSTANTS.Market.ORDER_STATUS),
            required: true,
        },
    },
    {timestamps: true},
)

const Order = mongoose.model('Order', order)

module.exports = Order
