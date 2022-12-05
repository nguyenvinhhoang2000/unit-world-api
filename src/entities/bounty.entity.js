'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const EntityConst = require('../constants/entity.constant')
const bounty = new Schema(
    {
        action: {
            type: String,
            required: true,
        },
        platform: {
            type: String,
            enum: Object.values(EntityConst.BOUNTY.PLATFORM),
        },
        content: {
            type: String,
            required: true,
        },
        rexReward: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(EntityConst.BOUNTY.STATUS),
        },
    },
    {timestamps: true},
)

const Bounty = mongoose.model('Bounty', bounty)

module.exports = Bounty
