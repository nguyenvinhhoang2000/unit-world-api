'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const staking = new Schema(
    {  
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        staking_package: {
            type: Schema.Types.ObjectId,
            ref: 'StakingPackage',
            required: true
        },
        start_time: {//milisecond - thời gian bắt đầu gói stake
            type: Number,
            required: true
        },
        end_time_reality: {//milisecond - thời gian kết thúc gói thực tế
            type: Number,
        },
        end_time_expected: {//milisecond - thời gian hoàn thành gói dự kiến 
            type: Number,
            required: true
        },
        claim_time: {   //thời gian có thể lấy lãi về
            type: Number,
        },
        staked: {
            type: Number, 
            required: true
        },
        actions: [
            {
                type: Schema.Types.ObjectId,
                ref: 'StakeAction',
                required: true
            },
        ],
        total_reward: { //thực tế nhận dc -> update khi kết thúc gói stake 
            type: Number, 
            default: 0,
        },
        invest_rate: { //update khi kết thúc gói
            invest_full: {
                type: Number,
            },
            invest_part: {
                type: Number,
            },
            invest_final: { //% lãi thực tế 
                type: Number,
            }
        },
        status: {
            type: String,
            enum: Object.values(CONSTANTS.EntityConst.STAKE.STATUS),
            default: CONSTANTS.EntityConst.STAKE.STATUS.STAKING
        }

    },
    {timestamps: true},
)

const Stake = mongoose.model('Stake', staking)

module.exports = Stake
