'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const EntityConst = require('../constants/entity.constant')
const project = new Schema(
    {
        no: {
            //sync từ smartcontract
            type: String,
            index: true,
            required: true,
            unique: true,
        },
        is_deployed: {
            type: Boolean,
            default: false,
        },
        name: {
            type: String,
            required: true,
            unique: true,
        },
        avatar: {
            type: String,
        },
        short_description: {
            type: String,
        },
        time_config: {
            open: {
                //thời gian mở bán cổ phần
                type: Date,
            },
            close: {
                //thời gian kết thúc mở bán cổ phần
                type: Date,
            },
            invest_duration: {
                //thời gian đầu tư, trong thời gian đầu tư có thể bán cổ phần; trong time này, sàn hoặc chủ đầu tư sẽ có đi bán sản phẩm bđs -> khi có người mua -> tạo yêu cầu vote bán -> >51% sẽ bán -> và trả lãi xuất cho nhà đầu tư
                type: Number,
            },
        },
        expected_interest_rate: {
            type: Number,
            required: true,
        },
        classification: {
            type: String,
            required: true,
        },
        type: {
            type: String,
        },
        stock_info: {
            type: Schema.Types.ObjectId,
            ref: 'Stock',
        },
        project_info: {
            type: Schema.Types.ObjectId,
            ref: 'ProjectInfo',
        },
        status: {
            type: String,
            enum: Object.values(EntityConst.PROJECT.STATUS),
            required: true,
            default: EntityConst.PROJECT.STATUS.WAITING,
        },
        msg: {
            type: String,
        },
        is_sold: {
            type: Boolean,
            default: false,
        },
        is_distributed: {
            type: Boolean,
            default: false,
        },
        is_refunded: {
            type: Boolean,
            default: false,
        },
        accept_offer: {
            type: Number,
            default: 0
        },
        total_claim_value: {
            type: Number,
            default: 0
        },
        total_claimed: {
            type: Number,
            default: 0
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
    },
    {timestamps: true},
)

const Project = mongoose.model('Project', project)

module.exports = Project
