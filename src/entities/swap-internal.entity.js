'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const swapInternal = new Schema(
    {
        ex_no: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        from: {
            type: String,
        },
    },
    {timestamps: true},
)

const SwapInternal = mongoose.model('SwapInternal', swapInternal)

module.exports = SwapInternal
