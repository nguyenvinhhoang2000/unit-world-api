'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const EntityConst = require('../constants/entity.constant')
const vote = new Schema(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true,
        },
        offer: {
            type: Schema.Types.ObjectId,
            ref: 'Offer',
            required: true,
            index: true,
        },
        voter: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        result: {
            type: Boolean
        },
        cancelled: { //huỷ vote
            type: Boolean
        },
        time: {
            type: Number
        },
        txid: {
            type: String
        },
        note: {
            type: String
        },
        status: {
            type: String,
            enum: Object.values(EntityConst.VOTE.STATUS),
            default: EntityConst.VOTE.STATUS.PENDING
        },
    },
    {timestamps: true},
)

const Vote = mongoose.model('Vote', vote)

module.exports = Vote
