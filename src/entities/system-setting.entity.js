'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const systemSetting = new Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        value: {
            type: Object,
        },
        note: {
            type: String,
        },
    },
    {timestamps: true},
)

const SystemSetting = mongoose.model('SystemSetting', systemSetting)

module.exports = SystemSetting
