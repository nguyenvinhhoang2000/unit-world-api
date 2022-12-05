'use strict'

const EntityConst = require('../constants/entity.constant')

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const rank = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        no: {
            type: Number,
            min: 1,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(EntityConst.RANK.STATUS),
            required: true,
        },
        config: {
            type: {
                type: String,
                enum: Object.values(EntityConst.RANK.RATE_TYPE),
                default: EntityConst.RANK.RATE_TYPE.STORED,
            },
            amount_from: {
                type: Number,
                required: true,
                default: 0,
                min: 0,
            },
            amount_to: {
                type: Number,
                required: true,
                default: 0,
                min: 0,
            },
        },
        discount: {
            is_applied: {
                type: Boolean,
                default: false,
            },
            type: {
                type: String,
                enum: Object.values(EntityConst.RANK.DISCOUNT_TYPE),
            },
            value: {
                type: Number,
                required: true,
                default: 0,
                min: 0,
            },
        },
        limit: {
            is_applied: {
                type: Boolean,
                default: false,
            },
            value: {
                type: Number,
                required: true,
                default: 0,
                min: 0,
            },
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
    },
    {timestamps: true},
)

const Rank = mongoose.model('Rank', rank)

module.exports = Rank
