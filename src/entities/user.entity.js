'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CONSTANTS = require('../constants/entity.constant')

const user = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            index: true,
            unique: true,
        },
        password: {
            type: String,
        },
        password_salt: {
            type: String,
        },
        password_alg: {
            type: String,
        },
        email: {
            type: String,
            unique: true,
            index: true,
            required: true,
        },
        phone: {
            type: String,
        },
        birthday: {
            type: String,
        },
        gender: {
            type: String,
            enum: Object.values(CONSTANTS.USER.GENDER),
        },
        status: {
            type: String,
            enum: Object.values(CONSTANTS.USER.STATUS),
        },
        active: {
            type: Boolean,
        },
        country: {
            type: String,
        },
        wallet: {
            type: Schema.Types.ObjectId,
            ref: 'Wallet',
        },
        referral: {
            type: Schema.Types.ObjectId,
            ref: 'Referral',
        },
        kyc: {
            type: Schema.Types.ObjectId,
            ref: 'Kyc',
        },
        avatar: {
            type: String,
        },
        role: {
            type: String,
            enum: Object.values(CONSTANTS.USER.ROLES),
            default: CONSTANTS.USER.ROLES.USER,
            required: true, // TODO: uncomment
        },
        bank_accounts: [
            {
                type: Schema.Types.ObjectId,
                ref: 'BankAccount',
            },
        ],
        devices: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Device',
            },
        ],
        add_info: {
            province: {type: String},
            district: {type: String},
            sub_district: {type: String},
            address: {type: String},
            zip: {type: String},
        },
        phone_verified: {
            type: Boolean,
            default: false
        },
        web_token: [
            {
                type: String,
            },
        ],
    },
    {timestamps: true},
)

const User = mongoose.model('User', user)

module.exports = User
