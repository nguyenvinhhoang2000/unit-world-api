const Utils = require('../../utils')
const CONSTANTS = require('../../constants')
const {RestError, GenCode} = require('../../utils')
const {Market} = require('./market')
const Queue = require('../../services/queue')
const {QUEUE_NAME} = require('../../constants/job.constant')
const {ContractProjectLib} = require('../../services/project/RexProjectContract.lib')
const moment = require('moment')

class IdoMarketAction extends Market {
    constructor(opts) {
        super(opts)
        this.marketName = CONSTANTS.Market.MARKET.IDO
    }

    addWhitelist = async (addresses) => {
        return await ContractProjectLib.addWhitelist(addresses)
    }
    getOrders = async ({page = 1, limit = 20, status}) => {
        try {
            const query = status ? {status} : {}
            limit = Number(limit)
            const offset = (page - 1) * limit
            let data = await this.model.Project.getModel()
                .find(query)
                .populate('stock_info')
                .populate('project_info')
                .sort({updatedAt: -1})
                .limit(Number(limit))
                .skip(offset)
                .lean()

            return data
        } catch (error) {
            throw error
        }
    }

    getHistory = async ({userId, page = 1, limit = 20, status, asUser, date}) => {
        const markets = await this.getMarkets(CONSTANTS.Market.MARKET.IDO)
        limit = Number(limit)
        const offset = (page - 1) * limit
        let query = {market: {$in: markets.map((m) => m._id)}}
        status && (query.status = status)
        if (asUser !== 'all') {
            query.owner = userId
        }
        if (date) {
            switch (date) {
                case 'W':
                    query = {
                        ...query,
                        ...{
                            createdAt: {
                                $gte: moment(new Date()).subtract(7, 'day'),
                            },
                        },
                    }
                    break
                case 'M':
                    query = {
                        ...query,
                        ...{
                            createdAt: {
                                $gte: moment(new Date()).subtract(1, 'month'),
                            },
                        },
                    }
                    break
                case '3M':
                    query = {
                        ...query,
                        ...{
                            createdAt: {
                                $gte: moment(new Date()).subtract(3, 'month'),
                            },
                        },
                    }
                    break
                default:
                    break
            }
        }

        let data = await this.model.Order.getModel()
            .find(query)
            .sort({updatedAt: -1})
            .limit(Number(limit))
            .skip(offset)
            .populate('market', '_id market pair ')
            .lean()

        let total = await this.model.Order.getModel().count(query)

        return {
            data,
            total,
        }
    }

    fulfillOrder = async ({userId, quantity, expiry, project}) => {
        let market = await this.model.Market.findOne({market: CONSTANTS.Market.MARKET.IDO})
        if (!market || !market.pair || !market.pair.asset || !market.pair.base || !market.active)
            throw RestError.NewNotAcceptableError('MARKET_CONFIG_INVALID', 400, [{market}])

        const orderData = {
            market: market._id,
            type: CONSTANTS.Market.ORDER.BUY,
            project,
            owner: userId,
            expiry: new Date(expiry),
            quantity,
            status: CONSTANTS.Market.ORDER_STATUS.PENDING,
        }

        // gen order no
        orderData.order_no = GenCode.genCode(7)

        // get project info
        const existingProject = await this.model.Project.findOne({_id: project})
        if (
            !existingProject ||
            new Date(existingProject.time_config.close).getTime() < Date.now() ||
            !existingProject.stock_info
        ) {
            throw RestError.NewNotAcceptableError('PROJECT_INVALID')
        }

        // Check stock info
        const stock = await this.model.Stock.findOne({_id: existingProject.stock_info})
        if (!stock) throw RestError.NewNotAcceptableError('STOCK_NOT_FOUND', 400, [{stock_info}])
        const {total_supply, circulating_supply} = stock

        if (total_supply - circulating_supply < quantity) {
            throw RestError.NewNotAcceptableError('OUT_OF_STOCK')
        }

        orderData.price = stock.ido_price || 1
        orderData.symbol = existingProject.no
        const amount = orderData.price * orderData.quantity
        let order = null

        // spent wallet and add job to issue via bc
        await this.wallet.usdrw.add(userId, -amount, async (opts, updated) => {
            // update stock circulating_supply
            stock.circulating_supply += quantity
            await stock.save(opts)

            order = await this.model.Order.getModel().create([orderData], opts)
        })

        // add to queue
        if (order && order.length > 0) await Queue.add(QUEUE_NAME.CONTRACT_BUY_IDO_PREPARE, {order_id: order[0]._id})

        return order
    }
}

module.exports = IdoMarketAction
