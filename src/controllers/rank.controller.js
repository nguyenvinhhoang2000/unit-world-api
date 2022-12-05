const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const Uuid = require('uuid').v4
const util = require('util')
//util
const Utils = require('../utils')
const CONSTANTS = require('../constants')
const {RestError, ResponseFormat} = require('../utils')

class Rank {
    constructor(opts) {
        this.model = opts.model
        this.action = opts.action
    }

    create = async ({
        name,
        no,
        description,
        status,
        config,
        discount,
        limit,
        lang,
    }) => {
        try {
            //validate
            let rank = await this.model.Rank.findOne({
                no: no,
                is_deleted: false
            })
            if (rank) {
                throw RestError.NewBadRequestError(`RANK__NO_IN_USE`)
            }
            rank = await this.model.Rank.findOne({
                name: name,
                is_deleted: false
            })
            if (rank) {
                throw RestError.NewBadRequestError(`RANK__NAME_IN_USE`)
            }
            
            //create rank
            rank = await this.action.Rank.createRank({
                name,
                no,
                description,
                status,
                config,
                discount,
                limit,
                lang,
            })

            return ResponseFormat.formatResponse(200, 'OK', rank)
        } catch (error) {
            throw error
        }
    }

    getByAdmin = async ({ key_search, page = 1, limit = 20, sort_by, type, status }) => {
        try {
            let filter = { is_deleted: false }
            limit = Number(limit)
            const skip = (Number(page) - 1) * limit

            if (type) {
                filter['config.type'] = type
            }

            if (status) {
                filter['status'] = status
            }

            if (key_search) {
                filter = {
                    ...filter,
                    name: { $regex: `.*${key_search}.*`, $options: 'i' },
                }
            }
            const total = await this.model.Rank.getModel().count({
                ...filter,
            })
            let data = await this.model.Rank.getModel()
                .find({
                    ...filter,
                })
                .skip(skip)
                .limit(limit)
                .sort({ updatedAt: -1 })
                .lean()

            return ResponseFormat.formatResponse(200, 'OK', { total, ranks: data })
        } catch (error) {
            throw error
        }
    }

    getDetailById= async (rank_id) => {
        try {
            let data = await this.model.Rank.findOne({
                _id: rank_id.rank_id,
                is_deleted:false}, {}, '', '', true)
            return ResponseFormat.formatResponse(200, 'OK', data)
        } catch (error) {
            throw error
        }
    }

    updateRank = async ({ 
        rank_id,
        name,
        no,
        description,
        status,
        config,
        discount,
        limit,
        lang,
     }) => {
        try {
            //validate
            let rank = await this.model.Rank.findOne({
                _id: {$ne: rank_id},
                no: no,
                is_deleted: false
            })
            if (rank) {
                throw RestError.NewBadRequestError(`RANK__NO_IN_USE`)
            }
            rank = await this.model.Rank.findOne({
                _id: {$ne: rank_id},
                name: name,
                is_deleted: false
            })
            if (rank) {
                throw RestError.NewBadRequestError(`RANK__NAME_IN_USE`)
            }

            rank = await this.action.Rank.updateRank({ 
                rank_id,
                name,
                no,
                description,
                status,
                config,
                discount,
                limit,
                lang,
             })
            return ResponseFormat.formatResponse(200, 'OK', rank)
        } catch (error) {
            throw error
        }
    }

    deleteRank = async ({ rank_id, lang }) => {
        try {
            let rank = await this.model.Rank.findOne({ _id: rank_id })
            if(rank?.no == 1){
                throw RestError.NewBadRequestError('Default rank is not allowed to delete')
            }

            // Không được xóa hạng khi đã có user thuộc hạng đó
            // to do

            await this.model.Rank.findOneAndUpdate({ _id: rank_id }, { is_deleted: true })

            return ResponseFormat.formatResponse(200, 'Deleted')
        } catch (error) {
            throw error
        }
    }
}

module.exports = Rank
