'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const offer = new Schema(
    {
        project: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Project',
        },
        symbol: {
            type: String,
            index: true,
            required: true,
        },
        index: {
            type: Number,
        },
        buyer: {
            type: String,
        },
        offerValue: {
            type: Number,
            required: true,
        },
        totalVoter: {
            type: Number,
            required: true,
        },
        start: {
            type: Number,
        },
        end: {
            type: Number,
        },
        accepted: {
            type: Number,
        },
        rejected: {
            type: Number,
        },
        isCanceled: {
            type: Number,
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

const Offer = mongoose.model('Offer', offer)

module.exports = Offer
