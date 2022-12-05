'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const wallet = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        usdt: {
            available_balance: {
                type: Number,
                required: true,
                default: 0,
            },
            balance: {
                type: Number,
                required: true,
                default: 0,
            },
        },
        fiat: {
            //vnd
            available_balance: {
                type: Number,
                required: true,
                default: 0,
            },
            balance: {
                type: Number,
                required: true,
                default: 0,
            },
        },
        token: {
            available_balance: {
                type: Number,
                required: true,
                default: 0,
            },
            balance: {
                type: Number,
                required: true,
                default: 0,
            },
            available_commission: {
                type: Number,
                required: true,
                default: 0,
            },
            commission: {
                type: Number,
                required: true,
                default: 0,
            },
        },
        public_token: {
            available_balance: {
                type: Number,
                required: true,
                default: 0,
            },
            balance: {
                type: Number,
                required: true,
                default: 0,
            },
            available_commission: {
                type: Number,
                required: true,
                default: 0,
            },
            commission: {
                type: Number,
                required: true,
                default: 0,
            },
        },

        add_info: {
            type: String,
        },
    },
    {timestamps: true},
)

const Wallet = mongoose.model('Wallet', wallet)

module.exports = Wallet
