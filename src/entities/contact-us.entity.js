'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const contactus = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        no: {
            type: String
        },
        name: {
            type: String,
            required: true,
            minLength: 3,
            maxLength: 50
        },
        email: {
            type: String,
            required: true,
            minLength: 3,
            maxLength: 50
        },
        phones: [{
            type: String,
            required: true,
            minLength: 9,
            maxLength: 11
        }],
        message: {
            type: String,
            required: true,
            minLength: 10,
            maxLength: 3000
        },
        address: {
            type: String,
        },
        status: {
            type: String
        }
    },
    {timestamps: true},
)

const ContactUs = mongoose.model('ContactUs', contactus)

module.exports = ContactUs
