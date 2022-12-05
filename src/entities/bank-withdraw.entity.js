'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const EntityConst = require('../constants/entity.constant')

const bankWithdraw = new Schema(
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
            required: true,
        },
        currency: {
            type: String,
            enum: Object.values(EntityConst.BANK_WITHDRAW.CURRENCY),
            default: 'VND',
        },
        status: {
            type: String,
            enum: Object.values(EntityConst.BANK_WITHDRAW.STATUS),
        },
        from: {
            //system bank-account
            type: Schema.Types.ObjectId,
            ref: 'BankAccount',
        },
        to: {
            //user bank-account
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
        verification_code: {
            type: String,
            required: true,
        },
        created_at_time: {
            //thời gian tạo yêu cầu rút
            type: Date,
        },
        confirmation: {
            is_confirmed: {
                //admin confirm đã gửi tiền cho user
                type: Boolean,
            },
            verification_screenshot: {
                //ảnh chụp giao dịch của user -> sẽ cần sử dụng để giải quyết tranh chấp, khiếu nại
                type: String,
            },
            note: {
                type: String,
            },
        },
    },
    {timestamps: true},
)

const BankWithdraw = mongoose.model('BankWithdraw', bankWithdraw)

module.exports = BankWithdraw
