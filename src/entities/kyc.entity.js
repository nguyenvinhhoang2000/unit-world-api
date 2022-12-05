'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const CONSTANTS = require('../constants')

const kyc = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        status: {
            //waiting (waiting user fill info) -> pending (waiting process) -> processing -> completed/canceled
            type: String,
            enum: Object.values(CONSTANTS.EntityConst.KYC.STATUS),
            default: CONSTANTS.EntityConst.KYC.STATUS.WAITING,
            required: true,
        },
        lastest_update: {
            type: Date,
        },
        step_1: {
            full_name: {
                type: String,
            },
            country: {
                type: String,
            },
            address: {
                type: String,
            },
            status: {
                //waiting (waiting user fill info -> processing -> completed/ERROR
                type: String,
                enum: Object.values(CONSTANTS.EntityConst.KYC.STATUS),
                default: CONSTANTS.EntityConst.KYC.STATUS.WAITING,
            },
        },
        step_2: {
            type: {
                type: String,
                enum: Object.values(CONSTANTS.EntityConst.KYC.TYPE),
            },
            number_id: {
                type: String,
            },
            status: [
                {
                    //waiting (waiting user fill info -> processing -> completed/ERROR
                    type: String,
                    enum: Object.values(CONSTANTS.EntityConst.KYC.STATUS),
                    default: CONSTANTS.EntityConst.KYC.STATUS.WAITING,
                },
            ],
            front_doc_img: {
                type: String,
            },
            behind_doc_img: {
                type: String,
            },
            note: {
                type: String,
            },
        },
        step_3: {
            type: {
                type: String,
                enum: Object.values(CONSTANTS.EntityConst.KYC.TYPE),
                default: CONSTANTS.EntityConst.KYC.TYPE.PERSIONAL,
            },
            img_location: {
                type: String,
            },
            status: {
                //waiting (waiting user fill info -> processing -> completed/ERROR
                type: String,
                enum: Object.values(CONSTANTS.EntityConst.KYC.STATUS),
                default: CONSTANTS.EntityConst.KYC.STATUS.WAITING,
            },
            additional: {
                type: String,
            },
            note: {
                type: String,
            },
        },
        step_4: {
            type: {
                type: String,
            },
            img_location: {
                type: String,
            },
            status: {
                //waiting (waiting user fill info -> processing -> completed/ERROR
                type: String,
                enum: Object.values(CONSTANTS.EntityConst.KYC.STATUS),
                default: CONSTANTS.EntityConst.KYC.STATUS.WAITING,
            },
            additional: {
                type: String,
            },
            note: {
                type: String,
            },
        },
    },
    {timestamps: true},
)

const Kyc = mongoose.model('Kyc', kyc)

module.exports = Kyc
