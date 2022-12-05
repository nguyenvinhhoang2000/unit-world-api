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
        asset: {
            type: String,
        },
        bases: [
            {
                type: String,
            },
        ],
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
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
        quantity: {
            //tổng số lượng
            type: Number,
            min: 0,
        },
        executed_qty: {
            //số lượng đã bán
            type: Number,
            min: 0,
            default: 0,
        },
        bank: {
            //user bank-account
            type: Schema.Types.ObjectId,
            ref: 'BankAccount',
        },
        limit: {
            // For taker
            minimum: {
                type: Number,
                default: 0,
            },
            maximum: {
                type: Number,
                default: -1,
            },
        },
        expiry: {
            type: Date,
        },
        msg: {
            type: String,
        },
        status: {
            type: String,
            enum: Object.values(EntityConst.ORDER.STATUS),
            required: true,
        },
        fills: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Order',
            },
        ],
    },
    {timestamps: true},
)

const Order = mongoose.model('OrderBook', order)

module.exports = Order
