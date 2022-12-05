'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const tfa = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        secret: {
            type: String,
            required: true,
        },
        path: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            default: CONSTANTS.EntityConst.TFA.INACTIVE,
            enum: Object.values(CONSTANTS.EntityConst.TFA),
        },
    },
    {timestamps: true},
)

const Tfa = mongoose.model('Tfa', tfa)

module.exports = Tfa
