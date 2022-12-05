const CONSTANTS = require('../../constants')

const Queue = require('../../services/queue')
const {QUEUE_NAME} = require('../../constants/job.constant')
const {RestError, GenCode} = require('../../utils')
const {Market} = require('./market')
const { round } = require('lodash')

/* 
    stock/vnd
    stock/bre
 */
class P2pMarketAction extends Market {
    constructor(opts) {
        super(opts)
        this.marketName = CONSTANTS.Market.MARKET.P2P
    }

    getOrders = async ({page = 1, limit = 20, query, order}) => {
        try {
            query = Object.assign(query, {})
            if(!order) order = {updatedAt: -1}
            limit = Number(limit)
            const offset = (page - 1) * limit
            console.log({query})
            let data = await this.model.OrderBook.getModel()
                .find(query)
                .populate('bank')
                .populate('project')
                .sort(order)
                .limit(Number(limit))
                .skip(offset)
                .lean()
            const total = await this.model.OrderBook.getModel().count(query)

            for(const ob of data) {
                const stockId = ob.project.stock_info
                const stock = await this.model.Stock.getModel().findOne({_id:stockId}).lean()
                ob.stockInfo = stock
            }

            return {
                total,
                data
            }
        } catch (error) {
            throw error
        }
    }

    getOrderHistory = async ({userId, page = 1, limit = 20, query, order, asUser}) => {
        try {
            const market = await this.getMarket(CONSTANTS.Market.MARKET.P2P)
            limit = Number(limit)
            const offset = (page - 1) * limit

            query = Object.assign(query, {market: market._id})
            if(asUser !== 'all') {
                query.owner = userId
            }

            if(!order) order = {updatedAt: -1}
            console.log({query})
            let data = await this.model.Order
                .getModel()
                .find(query)
                .populate('orderbook')
                .sort(order)
                .limit(Number(limit))
                .skip(offset)
                .populate('market')
                .lean()


            for(const ob of data) {
                const projectId = ob.orderbook.project

                const existingProject = await this.model.Project.getModel().findOne({_id: projectId}).lean()
                if (!existingProject || !existingProject.stock_info) {
                    throw RestError.NewNotAcceptableError('PROJECT_INVALID')
                }
                const stockId = existingProject.stock_info
                const stock = await this.model.Stock.getModel().findOne({_id:stockId}).lean()
                ob.stockInfo = stock
                ob.project = existingProject
            }


            const total = await this.model.Order.getModel().count(query)
            return {
                total,
                data
            }
        } catch (error) {
            throw error
        }
    }

    getOrderBookHistory = async ({userId, page = 1, limit = 20, query, order, asUser}) => {
        try {
            const market = await this.getMarket(CONSTANTS.Market.MARKET.P2P)
            limit = Number(limit)
            const offset = (page - 1) * limit

            query = Object.assign(query, {market: market._id})
            if(asUser !== 'all') {
                query.owner = userId
            }
            if(!order) order = {updatedAt: -1}

            console.log({query})
            let data = await this.model.OrderBook.getModel()
                .find(query)
                .populate('project')
                .sort(order)
                .limit(Number(limit))
                .skip(offset)
                .lean()
            const total = await this.model.OrderBook.getModel().count(query)

            for(const ob of data) {
                const stockId = ob.project.stock_info
                const stock = await this.model.Stock.getModel().findOne({_id:stockId}).lean()
                ob.stockInfo = stock
            }

            return {
                total,
                data
            }
        } catch (error) {
            throw error
        }
    }

    placeSellOrder = async ({userId, projectId, quantity, price, bases, expiry, limit, bank}) => {
        try {
            limit = Object.assign({minimum: 1, maximum: -1}, limit || {})
            bases.map((base) => {
                if (![CONSTANTS.Market.SYMBOL.USDR, CONSTANTS.Market.SYMBOL.VND].includes(base)) {
                    throw RestError.NewBadRequestError('TOKEN_NOT_SUPPORTED')
                }
            })
            let market = await this.getMarket(CONSTANTS.Market.MARKET.P2P)
            // get project info
            const existingProject = await this.model.Project.findOne({_id: projectId})
            if (!existingProject ||
                /* new Date(existingProject.time_config.close).getTime() < Date.now() || */ !existingProject.stock_info
            ) { // TODO: check time valid
                throw RestError.NewNotAcceptableError('PROJECT_INVALID')
            }

            // Pre-charging stock point then create new sell order book
            let data = undefined
            await this.wallet.stockw.add(userId, projectId, -quantity, async (opts, updated) => {
                const orderData = {
                    order_no: GenCode.genCode(7),
                    market: market._id,
                    type: CONSTANTS.Market.ORDER.SELL,
                    symbol: existingProject.no, // stock symbol
                    project: projectId,
                    owner: userId,
                    quantity,
                    bases: bases,
                    price,
                    limit,
                    expiry: new Date(expiry),
                    bank,
                    status: CONSTANTS.Market.ORDER_STATUS.OPEN,
                }

                data = await this.model.OrderBook.getModel().create([orderData], opts)

                await this.model.WalletHistory.getModel().create([{
                    user: userId,
                    currency: CONSTANTS.TokenConst.TOKEN.STOCK,
                    credit: -quantity,
                    amount: updated.amount,
                    action: CONSTANTS.EntityConst.WALLET_HISTORY.ACTION.P2P_ORDERBOOK_SELL,
                    actionId: data.length >0 && data[0]._id,
                    note: `${projectId}`,
                    status: CONSTANTS.EntityConst.WALLET_HISTORY.STATUS.COMPLETED,
                }], opts)
            })
            if(data && data.length >0) {
                const order = JSON.parse(JSON.stringify(data[0]))
                order.owner = await this.model.User.getModel().findOne({_id: order.owner})
                    .select('role email username name country birthday status avatar gender phone add_info').lean()
                return order
            }
            return data
        } catch (error) {
            throw error
        }
    }

    placeBuyOrder = async ({userId, projectId, quantity, price, bases, expiry, limit, bank}) => {
        try {
            limit = Object.assign({minimum: 1, maximum: -1}, limit || {})

            if (
                !bases ||
                bases.length == 0 ||
                ![CONSTANTS.Market.SYMBOL.USDR, CONSTANTS.Market.SYMBOL.VND].includes(bases[0])
            ) {
                throw RestError.NewBadRequestError('TOKEN_NOT_SUPPORTED')
            }
            const base = bases[0]

            let market = await this.getMarket(CONSTANTS.Market.MARKET.P2P)
            // get project info
            const existingProject = await this.model.Project.findOne({_id: projectId})
            if (
                !existingProject ||
                /* new Date(existingProject.time_config.close).getTime() < Date.now() || */ !existingProject.stock_info
            ) {
                throw RestError.NewNotAcceptableError('PROJECT_INVALID')
            }

            // Pre-charging money point then create new buy order book
            let data = undefined
            const amount = quantity * price

            const wallet = base == CONSTANTS.Market.SYMBOL.USDR ? this.wallet.usdrw : this.wallet.vndw
            await wallet.add(userId, -amount, async (opts) => {
                const orderData = {
                    order_no: GenCode.genCode(7),
                    market: market._id,
                    type: CONSTANTS.Market.ORDER.BUY,
                    symbol: existingProject.no, // stock symbol
                    project: projectId,
                    owner: userId,
                    quantity,
                    bases: [base],
                    price,
                    limit,
                    bank,
                    expiry: new Date(expiry),
                    status: CONSTANTS.Market.ORDER_STATUS.OPEN,
                }

                data = await this.model.OrderBook.getModel().create([orderData], opts)
            })

            if(data && data.length >0) {
                const order = JSON.parse(JSON.stringify(data[0]))
                order.owner = await this.model.User.getModel().findOne({_id: order.owner})
                    .select('role email username name country birthday status avatar gender phone add_info').lean()
                return order
            }
            return data
        } catch (error) {
            throw error
        }
    }

    _fulfillBuyOrder = async ({market, userId, orderBookId, quantity, base}) => {
        try {
            if (![CONSTANTS.Market.SYMBOL.USDR, CONSTANTS.Market.SYMBOL.VND].includes(base)) {
                throw RestError.NewBadRequestError('TOKEN_NOT_SUPPORTED')
            }
            let orderBook = await this.model.OrderBook.getModel().findOne({_id: orderBookId})
            if (!orderBook || orderBook.status != CONSTANTS.Market.ORDER_STATUS.OPEN) {
                throw RestError.NewNotAcceptableError(`ORDERBOOK_NOT_FOUND_OR_CLOSED`)
            }

            if (!orderBook.bases.includes(base)) {
                throw RestError.NewNotAcceptableError(`ORDERBOOK_NOT_ACCEPT_CURRENCY: ${JSON.stringify(orderBook.bases)} does not include ${base}`)
            }

            // charging stock from taker > update orderbook > send job to call sc
            let order = undefined
            const wallet = base == CONSTANTS.Market.SYMBOL.USDR ? this.wallet.usdtw : this.wallet.vndw
            const projectId = orderBook.project

            // TODO: add locker
            // chargin taker
            await this.wallet.stockw.add(userId, projectId, -quantity, async (opts, updated) => {
                // create new sell order
                const orderData = {
                    order_no: GenCode.genCode(7),
                    market: market._id,
                    type: CONSTANTS.Market.ORDER.SELL,
                    symbol:
                        base == CONSTANTS.Market.SYMBOL.USDR
                            ? CONSTANTS.Market.PAIR.STOCK_USDR
                            : CONSTANTS.Market.PAIR.STOCK_VND,
                    owner: userId,
                    quantity,
                    price: orderBook.price,
                    orderbook: orderBook._id,
                    status: CONSTANTS.Market.ORDER_STATUS.PENDING,
                }
                order = await this.model.Order.getModel().create([orderData], opts)
                if (!order || order.length == 0) throw RestError.NewNotAcceptableError(`CREATE_ORDER_FAILED`)
                // update order book
                orderBook.executed_qty += quantity
                if (orderBook.executed_qty > orderBook.quantity) {
                    throw RestError.NewNotAcceptableError(`ORDERBOOK_NOT_ENOUGH`)
                }
                orderBook.fills = [...orderBook.fills, order[0]._id]
                await orderBook.save(opts)
            })

            if (order) {
                if (base == CONSTANTS.Market.SYMBOL.USDR) {
                    await Queue.add(QUEUE_NAME.CONTRACT_EXCHANGE_STOCK_USDR, {order_id: order[0]._id})
                } else {
                    await Queue.add(QUEUE_NAME.CONTRACT_EXCHANGE_STOCK_FIAT, {order_id: order[0]._id})
                }
            }

            return order
        } catch (error) {
            throw error
        }
    }

    _fulfillSellOrder = async ({market, userId, orderBookId, quantity, base}) => {
        try {
            let orderBook = await this.model.OrderBook.getModel().findOne({_id: orderBookId})
            if (!orderBook || orderBook.status != CONSTANTS.Market.ORDER_STATUS.OPEN) {
                throw RestError.NewNotAcceptableError(`ORDERBOOK_NOT_FOUND_OR_CLOSED`)
            }

            if (!orderBook.bases.includes(base)) {
                throw RestError.NewNotAcceptableError(`ORDERBOOK_NOT_ACCEPT_CURRENCY: ${JSON.stringify(orderBook.bases)} does not include ${base}`)
            }

            // charging money from taker > update orderbook > send job to call sc
            let order = undefined
            const wallet = base == CONSTANTS.Market.SYMBOL.USDR ? this.wallet.usdrw : this.wallet.vndw
            let amount = quantity * orderBook.price

            const orderData = {
                order_no: GenCode.genCode(7),
                market: market._id,
                type: CONSTANTS.Market.ORDER.BUY,
                project: orderBook.project,
                symbol:
                    base == CONSTANTS.Market.SYMBOL.USDR
                        ? CONSTANTS.Market.PAIR.STOCK_USDR
                        : CONSTANTS.Market.PAIR.STOCK_VND,
                owner: userId,
                quantity,
                price: orderBook.price,
                orderbook: orderBook._id,
                status: CONSTANTS.Market.ORDER_STATUS.PENDING,
            }
            // TODO: add locker
            // chargin taker
            try {
                await wallet.add(userId, -amount, async (opts) => {
                    try {
                        // create new sell order
                        order = await this.model.Order.getModel().create([orderData], {...opts})
                        if (!order || order.length == 0) throw RestError.NewNotAcceptableError(`CREATE_ORDER_FAILED`)
                        // update order book
                        orderBook.executed_qty += quantity
                        if (orderBook.executed_qty > orderBook.quantity) {
                            throw RestError.NewNotAcceptableError(`ORDERBOOK_NOT_ENOUGH`)
                        }
                        if(!orderBook.fills.includes(order[0]._id)) orderBook.fills = [...orderBook.fills, order[0]._id]
                        await orderBook.save(opts)
                    } catch (error) {
                        order = null
                        throw error
                    }
                })
            } catch (error) {
                if(error.message === 'NOT_ENOUGH_MONEY' && base === CONSTANTS.Market.SYMBOL.VND && orderBook.bank) {
                    // create new sell order
                    orderData.status = CONSTANTS.Market.ORDER_STATUS.WAITING_FIAT_SEND // waiting for buyer to send money p2p
                    orderData.charging_method = 'manual'
                    order = await this.model.Order.getModel().create([orderData])

                    // update order book
                    orderBook.executed_qty += quantity
                    if (orderBook.executed_qty > orderBook.quantity) {
                        throw RestError.NewNotAcceptableError(`ORDERBOOK_NOT_ENOUGH`)
                    }
                    if(!orderBook.fills.includes(order[0]._id)) orderBook.fills = [...orderBook.fills, order[0]._id]
                    await orderBook.save()
                    
                    return order.length>0 && order[0]
                } else {
                    throw error
                }
            }

            if (order) {
                if (base == CONSTANTS.Market.SYMBOL.USDR) {
                    await Queue.add(QUEUE_NAME.CONTRACT_EXCHANGE_STOCK_USDR, {order_id: order[0]._id})
                } else {
                    await Queue.add(QUEUE_NAME.CONTRACT_EXCHANGE_STOCK_FIAT, {order_id: order[0]._id})
                }
            }

            return order
        } catch (error) {
            throw error
        }
    }

    cancelOrderBook = async ({user, orderbookId}) => {
        try {
            let market = await this.getMarket(CONSTANTS.Market.MARKET.P2P)
            const orderbook = await this.model.OrderBook.getModel().findOne({
                _id: orderbookId,
                owner: user._id,
                market: market._id,
                status: CONSTANTS.Market.ORDER_STATUS.OPEN
            })
            if(!orderbook) {
                throw RestError.NewNotFoundError(`Cannot found orderbook ${orderbookId}`)
            }
            // find any order is pending with any status other than REFUND, FULFILLED 
            const pendingOrders = await this.model.Order.getModel().find({
                orderbook: orderbook._id,
                symbol: { $in: [CONSTANTS.Market.PAIR.STOCK_VND, CONSTANTS.Market.PAIR.STOCK_USDR] },
                status: { $nin: [
                    CONSTANTS.Market.ORDER_STATUS.FULFILLED, 
                    CONSTANTS.Market.ORDER_STATUS.CANCELLED,
                    CONSTANTS.Market.ORDER_STATUS.REFUND
                ] }
            })
            if(pendingOrders && pendingOrders.length > 0) {
                throw RestError.NewNotAcceptableError(`Cannot cancel at this time there is pending order ${JSON.stringify(pendingOrders.map(o => o._id))}`)
            }

            const amount = orderbook.quantity - orderbook.executed_qty
            const cashAmount = round(amount * orderbook.price, 2)
            if(amount <= 0) throw RestError.NewNotAcceptableError(`Cannot cancel, the orderbook was already fulfilled`)
            let wallet = undefined
            if(orderbook.bases.includes(CONSTANTS.TokenConst.TOKEN.USDR)) {
                wallet = this.wallet.usdrw
            } else if(orderbook.bases.includes(CONSTANTS.TokenConst.TOKEN.USDT)) {
                wallet = this.wallet.usdtw
            } else if(orderbook.bases.includes(CONSTANTS.TokenConst.TOKEN.VND)) {
                wallet = this.wallet.vndw
            } else if(orderbook.bases.includes(CONSTANTS.TokenConst.TOKEN.REX)) {
                wallet = this.wallet.rexw
            } else {}

            if(!wallet) throw RestError.NewNotAcceptableError(`Cannot cancel, cash unit is invalid`)

            let updated = null

            if(orderbook.type == CONSTANTS.Market.ORDER.BUY) {
                await wallet.add(user._id, cashAmount, async(opts) => {
                    orderbook.status = CONSTANTS.Market.ORDER_STATUS.CANCELLED
                    await orderbook.save(opts)

                    // updated = await this.model.OrderBook.getModel().findOne({
                    //     _id: orderbookId,
                    //     owner: user._id,
                    //     market: market._id
                    // }, {session: opts.session})
                    // if(!updated || updated.executed_qty != orderbook.executed_qty || 
                    //     updated.status != CONSTANTS.Market.ORDER_STATUS.CANCELLED) {
                    //     throw RestError.NewNotAcceptableError(`Cannot cancel, please try again later`)
                    // }
                })
            } else {
                await this.wallet.stockw.add(user._id, orderbook.project, amount, async (opts, updated) => {
                    orderbook.status = CONSTANTS.Market.ORDER_STATUS.CANCELLED
                    await orderbook.save(opts)

                        await this.model.WalletHistory.getModel().create([{
                            user: user._id,
                            currency: CONSTANTS.TokenConst.TOKEN.STOCK,
                            credit: amount,
                            amount: updated.amount,
                            action: CONSTANTS.EntityConst.WALLET_HISTORY.ACTION.P2P_ORDERBOOK_CANCEL,
                            actionId: orderbook._id,
                            note: `${orderbook.project}`,
                            status: CONSTANTS.EntityConst.WALLET_HISTORY.STATUS.COMPLETED,
                        }], opts)
                })
            }

            return orderbook
        } catch(error) {
            console.error(error)
            throw error
        }
    }

    fulfillOrder = async({userId, orderBookId, quantity, type, base}) => {
        let order = null
        let market = await this.getMarket(CONSTANTS.Market.MARKET.P2P)

        console.log(`[P2P] fulfill order`, {userId, orderBookId, quantity, type, base})

        if(type === CONSTANTS.Market.ORDER.BUY) {
            order = await this._fulfillSellOrder({market, userId, orderBookId, quantity, base})
        } else if(type === CONSTANTS.Market.ORDER.SELL) {
            order = await this._fulfillBuyOrder({market, userId, orderBookId, quantity, base})
        } else {
            // do nothing
        }

        if(order) {
            order.owner = await this.model.User.getModel().findOne({_id: order.owner}).lean()
        }
        return order
    }
}

module.exports = P2pMarketAction
