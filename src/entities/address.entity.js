'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const address = new Schema(
    {
        address: {
            type: String,
            unique: true,
            index: true,
            required: true,
        },
        private_key: {
            type: String,
            required: true,
        },
        blockchain: {
            type: String,
            default: 'BSC',
        },
    },
    {timestamps: true},
)

const Address = mongoose.model('Address', address)

module.exports = Address
