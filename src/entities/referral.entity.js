'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const referral = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        code: {
            type: String,
            unique: true,
            required: true,
        },
        referrer: {
            type: String,
        },
        register_reward: {
            type: Number,
            default: 0,
        },
    },
    {timestamps: true},
)

const Referral = mongoose.model('Referral', referral)

module.exports = Referral
