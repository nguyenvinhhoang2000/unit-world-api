'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const stakingAction = new Schema(
    {
        staking: {
            type: Schema.Types.ObjectId,
            ref: 'Staking'
        },
        tx_hash: {
            type: String,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        note: {
            type: Object
        },
        time: {
            type: Date
        },
        action: {
            type: String,
            enum: Object.values(CONSTANTS.EntityConst.STAKE.ACTION)
        }
    },
    { timestamps: true },
)

const StakeAction = mongoose.model('StakeAction', stakingAction)

module.exports = StakeAction
