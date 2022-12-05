'use strict'

const mongoose = require('mongoose')

const Schema = mongoose.Schema

const activityLog = new Schema(
    {
        account: {
            type: String,
        },
        ipAddress: {
            type: String,
            required: false,
            default: '',
        },
        action: {
            type: String,
            required: false,
            default: '',
        },
        data: {
            type: String,
            required: false,
            default: '',
        },
    },
    {timestamps: true},
)

const ActivityLog = mongoose.model('ActivityLog', activityLog)

module.exports = ActivityLog
