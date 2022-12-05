const Utils = require('../../utils')
const CONSTANTS = require('../../constants')
const { RestError } = require('../../utils')
const { performTransaction } = require('../../utils/mongo.util')
const {round} = require('lodash')
const { normalizeTokenAmount, weiToEther } = require('../../utils/token.util')

class StockWallet {
    constructor(opts) {
        this.currency = CONSTANTS.EntityConst.PROJECT.STOCK
        this.model = opts.model
    }

    get = async (userId) => {
        const stocks = await this.model.Share.getModel().find({ user: userId }).populate('project').lean()
        return stocks
    }

    add = async (userId, projectId, amount, callback = null, session = null) => {
        console.log(`[Wallet][${this.currency}] Credit user ${userId} project ${projectId} = ${amount}`)

        const _add = async ({ userId, projectId, amount }, opts = {}) => {
            let updated = await this.model.Share.getModel().findOneAndUpdate(
                { user: userId, project: projectId },
                {
                    $inc: { amount: amount },
                },
                opts,
            )

            if (!updated && amount > 0) {
                updated = await this.model.Share.getModel().create([
                    { user: userId, project: projectId, amount }
                ], opts)
            }

            console.log({ updated })
            if (!updated || updated.amount < 0) throw RestError.NewNotAcceptableError('NOT_ENOUGH_STOCK')
            if (callback) await callback(opts)
        }

        return await performTransaction(_add, { userId, projectId, amount }, session)
    }

    getStock = async ({ userId, query, sort, page, search_key, limit }) => {
        let projectQuery = {}

        Object.keys(query).map((key) => {
            if (key.startsWith('project.')) {
                projectQuery[key.replace('project.', '')] = query[key]
                delete query[key]
            }
        })
        if (search_key && search_key.length > 0) {
            projectQuery = {
                ...projectQuery,
                $or: [
                    { "name": { $regex: `.*${search_key}.*`, $options: 'i' } },
                    { "no": { $regex: `.*${search_key}.*`, $options: 'i' } }
                ]
            }
        }

        let filter = Object.assign({
            user: userId
        }, query || {})
       


        const _sort = Object.assign({
            updatedAt: -1
        }, sort || {})

        page = page ? Number(page) : 1
        limit = limit ? Number(limit) : 20
        const skip = (page - 1) * limit

        let shares = []
        let pageSearch = 1
        let search = []
        let match = false
        let total = 0

        do {
            search = await this.model.Share.getModel().find(filter)
                .sort(_sort)
                .populate({
                    path: 'project',
                    match: projectQuery,
                    select: '-project_info'
                })
                .limit(50).skip((pageSearch++ - 1) * 50)
                .lean()


            const matchSearch = search.filter(s => !!(s.project))
            total += matchSearch.length

            if (match) continue

            shares = [...shares, ...matchSearch]

            if (shares.length >= limit) {
                if (page == 1) {
                    shares = shares.slice(0, limit)
                    match = true
                } else {
                    --page
                    shares.splice(0, limit)
                }
            }
        } while (search.length > 0)

        for (const share of shares) {
            const rexClaimed = await this.model.ClaimReward.getModel().aggregate([
                {
                    $match: {
                        user: userId,
                        project: share.project._id,
                        status: CONSTANTS.EntityConst.PROJECT.STATUS_USER.FINISHED
                    },
                },
                {
                    $group: {
                        _id: null,
                        amount: { $sum: '$amount' },
                    },
                },
            ])

            share.rexClaimed = rexClaimed && rexClaimed.length > 0 ? rexClaimed[0].amount : 0

            share.project_info = await this.model.ProjectInfo.getModel().findOne({ project: share.project._id }).lean()
            share.stock_info = await this.model.Stock.getModel().findOne({ project: share.project._id }).lean()

            //check vote
            let vote = await this.model.Vote.getModel().findOne({ voter: userId, project: share.project._id}).sort({createdAt:-1})
            if (!vote) {
                share.vote = {
                    status: null,
                }
            } else {
                share.vote = {
                    status: vote.status,
                    type: vote.result? 'vote': 'reject'
                }
            }
            if(share.project && share.project.total_claim_value && share.rexClaimed > 0) {
                const unClaimed = round(share.project.total_claim_value / share.stock_info.total_supply * share.amount)
                share.unClaimed = round(weiToEther(`${unClaimed}`), 6)
            } else share.unClaimed = 0
        }

        return {
            total,
            shares
        }
    }
}

module.exports = StockWallet
