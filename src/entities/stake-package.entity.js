'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const stakingPackage = new Schema(
    {  
        code: {
            type: String,
            unique: true,
            required: true,
            index: true
        },
        title: {
            type: String
        },
        is_public: {
            type: Boolean,
            default: false,
            required: true
        },
        is_deleted: {
            type: Boolean,
            default: false,
            required: true
        },
        invest_duration: { 
            duration: { //milisecond
                type: Number,
                required: true
            },
            duration_display: {
                type: String,
                required: true
            }
        },
        locked_time: { //sau khi unstake trước thời hạn sẽ bị khoá 1 thời gian
            type: Number,
            default: 86400000,
            min: 86400000,
            required: true
        },
        invest_full: { //chỉ áp dụng khi ko huỷ gói giữa chừng (%/nam)
            type: Number, 
            required: true
        },
        intest_part: { //chỉ áp dụng khi huỷ gói giữa chừng (%/nam)
            type: Number, 
            default: 0,
            required: true
        },
        total_pool: { 
            type: Number,
            min: 0,
            required: true
        },
        total_staked: { //phần đang phải trả lãi 
            type: Number,
            min: 0,
            default: 0,
            required: true
        },
        min_staking: {
            type: Number,
            required: true,
            min: 0
        },
        max_staking: {
            type: Number,
            required: true,
            min: 1
        },
        total_joined: { //total user used
            type: Number,
            required: true,
            default: 0
        }
    },
    {timestamps: true},
)

const StakePackage = mongoose.model('StakePackage', stakingPackage)

module.exports = StakePackage
