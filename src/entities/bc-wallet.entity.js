'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const bcWallet = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        address: {
            type: String,
            unique: true,
            required: true,
        },
        private_key: {
            type: String,
            unique: true,
            required: true,
        },
        mnemonic: {
            type: String,
        },
        inactive: {
            type: Boolean,
            default: false,
        },
        default: {
            type: Boolean,
            default: true,
        },
        network: {
            type: String,
            required: true,
            default: CONSTANTS.TokenConst.NETWORK.BSC,
            enum: Object.values(CONSTANTS.TokenConst.NETWORK),
        },
        approved: [{
            type: String,
            default: [],
            enum: Object.values(CONSTANTS.TokenConst.TOKEN),
        }
        ]
    },
    {timestamps: true},
)

const BcWallet = mongoose.model('BcWallet', bcWallet)

module.exports = BcWallet
