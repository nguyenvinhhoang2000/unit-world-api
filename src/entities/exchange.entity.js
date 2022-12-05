'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const EntityConst = require('../constants/entity.constant')

const exchange = new Schema(
    {
        ex_no: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
    },
    {timestamps: true},
)

const Exchange = mongoose.model('Exchange', exchange)

module.exports = Exchange
