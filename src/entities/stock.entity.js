'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const stock = new Schema(
    {
        symbol: {
            type: String,
            unique: true,
            index: true,
            required: true,
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
        },
        ido_price: {
            type: Number,
        },
        total_supply: {
            // tổng lượng stock
            type: Number,
            required: true,
        },
        circulating_supply: {
            // lượng stock đã bán (lưu thông)
            type: Number,
            required: true,
        },
        investors: [
            // chứa Id của cả những investor đã bán cổ phần
            {
                type: Schema.Types.ObjectId,
                ref: 'Investor',
            },
        ],
        total_investors: {
            //balance > 0
            type: Number,
        },
    },
    {timestamps: true},
)

const Stock = mongoose.model('Stock', stock)

module.exports = Stock
