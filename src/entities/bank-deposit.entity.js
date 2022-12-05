'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const EntityConst = require('../constants/entity.constant')

const bankDeposit = new Schema(
    {
        no: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        quantity: {
            //vnd
            type: Number,
            min: 0,
            required: true,
        },
        currency: {
            type: String,
            enum: Object.values(EntityConst.BANK_DEPOSIT.CURRENCY),
            default: 'VND',
        },
        fee: {
            type: Number,
            required: true,
            default: 0,
        },
        status: {
            type: String,
            enum: Object.values(EntityConst.BANK_DEPOSIT.STATUS),
        },
        from: {
            //user bank-account
            type: Schema.Types.ObjectId,
            ref: 'BankAccount',
        },
        to: {
            //system bank-account
            type: Schema.Types.ObjectId,
            ref: 'BankAccount',
            required: true,
        },
        owner: {
            //user
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        created_at_time: {
            //thời gian tạo yêu cầu gửi
            type: Date,
        },
        confirmation: {
            is_confirmed: {
                type: Boolean,
            },
            verification_screenshot: {
                type: String,
            },
            note: {
                type: String,
            },
        },
    },
    {timestamps: true},
)

const BankDeposit = mongoose.model('BankDeposit', bankDeposit)

module.exports = BankDeposit
