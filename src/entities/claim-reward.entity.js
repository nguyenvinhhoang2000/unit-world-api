'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const claimReward = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        project: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Project',
        },
        amount: {
            type: Number
        },
        txid: {
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

const ClaimReward = mongoose.model('ClaimReward', claimReward)

module.exports = ClaimReward
