'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const EntityConst = require('../constants/entity.constant')
const bounty = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        bounty: {
            type: Schema.Types.ObjectId,
            ref: 'Bounty',
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
        platform: {
            type: String,
            required: true,
        },
        reference: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(EntityConst.BOUNTY.COMPLETION_STATUS),
        },
        rewardTx: {
            type: String
        },
        note: {
            type: String
        }
    },
    {timestamps: true},
)

const BountyCompletion = mongoose.model('BountyCompletion', bounty)

module.exports = BountyCompletion
