'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const share = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        symbol: {
            type: String
        },
        amount: {
            type: Number,
            required: true,
            default: 0,
        }
    },
    {timestamps: true},
)

const Share = mongoose.model('Share', share)

module.exports = Share
