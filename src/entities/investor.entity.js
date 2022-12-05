'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const investor = new Schema(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
        },
    },
    {timestamps: true},
)

const Investor = mongoose.model('Investor', investor)

module.exports = Investor
