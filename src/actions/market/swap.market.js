const Utils = require('../../utils')
const CONSTANTS = require('../../constants')
const {Market} = require('./market')
const Queue = require('../../services/queue')
const {QUEUE_NAME} = require('../../constants/job.constant')
const {RestError, GenCode} = require('../../utils')
const {getVndRate} = require('../../utils/price.util')
const { DIFF_TIME } = require('../../constants/utils.constant')
const { getEnv } = require('../../utils/getEnv.util')
const { round } = require('lodash')
const rexPriceImpactWeight = getEnv('REX_PRICE_ESTIMATION_WEIGHT') || 1000
/* 
    bre/usdt
    bre/vnd
 */
class SwapMarketAction extends Market {
    constructor(opts) {
        super(opts)
        this.marketName = CONSTANTS.Market.MARKET.SWAP
    }

    _buyTokenByUsdt = async ({market, userId, quantity}) => {
        const price = 1
        const orderData = {
            market: market._id,
            type: CONSTANTS.Market.ORDER.BUY,
            symbol: CONSTANTS.Market.PAIR.USDR_USDT,
            owner: userId,
            quantity,
            price,
            status: CONSTANTS.Market.ORDER_STATUS.PENDING,
        }

        // gen order no
        orderData.order_no = GenCode.genCode(7)

        const spentUsdt = quantity * price

        let order = null
        // spent wallet and add job to issue via bc
        await this.wallet.usdtw.add(userId, -spentUsdt, async (opts, updated) => {
            order = await this.model.Order.getModel().create([orderData], opts)
        })

        return order
    }

    _buyTokenByVnd = async ({market, userId, quantity}) => {
        const price = 23000 // TODO: get live price
        const orderData = {
            market: market._id,
            type: CONSTANTS.Market.ORDER.BUY,
            symbol: CONSTANTS.Market.PAIR.USDR_VND,
            owner: userId,
            quantity,
            price,
            status: CONSTANTS.Market.ORDER_STATUS.PENDING,
        }

        // gen order no
        orderData.order_no = GenCode.genCode(7)

        const spentVnd = round(quantity * price)

        let order = null
        // spent wallet and add job to issue via bc
        await this.wallet.vndw.add(userId, -spentVnd, async (opts, updated) => {
            order = await this.model.Order.getModel().create([orderData], opts)

            await this.model.WalletHistory.getModel().create([{
                user: userId,
                currency: CONSTANTS.TokenConst.TOKEN.VND,
                credit: -spentVnd,
                amount: updated.amount,
                action: CONSTANTS.EntityConst.WALLET_HISTORY.ACTION.SWAP_USDR,
                actionId: order.length >0 && order[0]._id,
                note: 'order',
                status: CONSTANTS.EntityConst.WALLET_HISTORY.STATUS.COMPLETED,
            }], opts)
        })

        return order
    }

    _sellTokenToUsdt = async ({market, userId, quantity}) => {
        const price = 1
        const orderData = {
            market: market._id,
            type: CONSTANTS.Market.ORDER.SELL,
            symbol: CONSTANTS.Market.PAIR.USDR_USDT,
            owner: userId,
            quantity,
            price,
            status: CONSTANTS.Market.ORDER_STATUS.PENDING,
        }

        // gen order no
        orderData.order_no = GenCode.genCode(7)

        const spentBre = quantity

        let order = null
        // spent wallet and add job to issue via bc
        await this.wallet.usdrw.add(userId, -spentBre, async (opts, updated) => {
            order = await this.model.Order.getModel().create([orderData], opts)
        })

        return order
    }

    _sellTokenToVnd = async ({market, userId, quantity}) => {
        const price = await getVndRate()
        const orderData = {
            market: market._id,
            type: CONSTANTS.Market.ORDER.SELL,
            symbol: CONSTANTS.Market.PAIR.USDR_VND,
            owner: userId,
            quantity,
            price,
            status: CONSTANTS.Market.ORDER_STATUS.PENDING,
        }

        // gen order no
        orderData.order_no = GenCode.genCode(7)

        const spentBre = quantity

        let order = null
        // spent wallet and add job to issue via bc
        await this.wallet.usdrw.add(userId, -spentBre, async (opts, updated) => {
            order = await this.model.Order.getModel().create([orderData], opts)

            await this.model.WalletHistory.getModel().create([{
                user: userId,
                currency: CONSTANTS.TokenConst.TOKEN.USDR,
                credit: -spentBre,
                amount: updated.amount,
                action: CONSTANTS.EntityConst.WALLET_HISTORY.ACTION.SWAP_USDR,
                actionId: order.length >0 && order[0]._id,
                note: 'order',
                status: CONSTANTS.EntityConst.WALLET_HISTORY.STATUS.COMPLETED,
            }], opts)
        })

        return order
    }

    _updateRexPrice = async(rexBasePrice) => {
        if(!rexBasePrice || !rexBasePrice.value ) throw RestError.NewInternalServerError(`can not get rex price setting`)
        const diffTime = (Date.now() - rexBasePrice.value.updatedAt) 
        const ndays = round(diffTime / DIFF_TIME.ONE_DAY, 6)
        if(ndays < 1) {
            return rexBasePrice
        }

        let totalBuyLastTime = await this.model.Order.getModel().aggregate([{
                $match: {
                    symbol: { $in: [ CONSTANTS.Market.PAIR.REX_VND, CONSTANTS.Market.PAIR.REX_USDT] },
                    type: CONSTANTS.Market.ORDER.BUY,
                    status: CONSTANTS.Market.ORDER_STATUS.FULFILLED,
                    updatedAt: { $lt: new Date(rexBasePrice.value.updatedAt) }
                },
            }, {
                $group: {
                    _id: null,
                    amount: { $sum: '$quantity' },
                },
            },
        ])
        totalBuyLastTime = totalBuyLastTime.length > 0 ? totalBuyLastTime[0].amount : 0

        let totalSellLastTime = await this.model.Order.getModel().aggregate([{
                $match: {
                    symbol: { $in: [ CONSTANTS.Market.PAIR.REX_VND, CONSTANTS.Market.PAIR.REX_USDT] },
                    type: CONSTANTS.Market.ORDER.SELL,
                    status: CONSTANTS.Market.ORDER_STATUS.FULFILLED,
                    updatedAt: { $lt: new Date(rexBasePrice.value.updatedAt) }
                },
            }, {
                $group: {
                    _id: null,
                    amount: { $sum: '$quantity' },
                },
            },
        ])
        totalSellLastTime = totalSellLastTime.length > 0 ? totalSellLastTime[0].amount : 0

        console.log({rexBasePrice})
        console.log({totalSellLastTime, totalBuyLastTime, ndays})
        const volumeAccelerate = (totalBuyLastTime - totalSellLastTime) / ndays
        console.log({volumeAccelerate, rexPriceImpactWeight})
        const priceChange = rexBasePrice.value.price * 0.01 * (volumeAccelerate/Number(rexPriceImpactWeight))
        const newPrice = round(rexBasePrice.value.price + priceChange, 6)
        console.log(`[Swap] updating new price of REX = ${newPrice}`)
        return await this.model.SystemSetting.getModel().findOneAndUpdate({key: 'REX_BASE_PRICE'}, {
            'value.price': newPrice,
            'value.updatedAt': Date.now()
        }, { new: true})
    }

    _getRexPrice = async() => {
        let rexBasePrice = await this.model.SystemSetting.getModel().findOne({key: 'REX_BASE_PRICE'})
        if(!rexBasePrice) {
            const newSettings = await this.model.SystemSetting.getModel().create([{
                key: 'REX_BASE_PRICE',
                value: {
                    price: 0.1, // ask price
                    spread: 0.03, // 3%
                    updatedAt: Date.now() 
                }
            }])
            rexBasePrice = newSettings.length > 0 && newSettings[0]
        }

        return await this._updateRexPrice(rexBasePrice)
    }

    _sellRexToVnd = async ({market, userId, quantity}) => {
        const priceSetting = await this._getRexPrice()
        const vndRate = await getVndRate()
        const price =  round(priceSetting.value.price * (1 - priceSetting.value.spread) * vndRate, 2)
        const orderData = {
            market: market._id,
            type: CONSTANTS.Market.ORDER.SELL,
            symbol: CONSTANTS.Market.PAIR.REX_VND,
            owner: userId,
            quantity,
            price,
            status: CONSTANTS.Market.ORDER_STATUS.PENDING,
        }

        // gen order no
        orderData.order_no = GenCode.genCode(7)

        const spentBre = quantity

        let order = null
        // spent wallet and add job to issue via bc
        await this.wallet.rexw.add(userId, -spentBre, async (opts, updated) => {
            order = await this.model.Order.getModel().create([orderData], opts)
        })

        return order
    }

    _buyRexByVnd = async ({market, userId, quantity}) => {
        const priceSetting = await this._getRexPrice()
        console.log({priceSetting})
        const vndRate = await getVndRate()
        const price = round(priceSetting.value.price * vndRate, 2)
        const orderData = {
            market: market._id,
            type: CONSTANTS.Market.ORDER.BUY,
            symbol: CONSTANTS.Market.PAIR.REX_VND,
            owner: userId,
            quantity,
            price,
            status: CONSTANTS.Market.ORDER_STATUS.PENDING,
        }

        // gen order no
        orderData.order_no = GenCode.genCode(7)

        const spentVnd = round(quantity * price)

        let order = null
        // spent wallet and add job to issue via bc
        await this.wallet.vndw.add(userId, -spentVnd, async (opts, updated) => {
            order = await this.model.Order.getModel().create([orderData], opts)
            
            await this.model.WalletHistory.getModel().create([{
                user: userId,
                currency: CONSTANTS.TokenConst.TOKEN.VND,
                credit: -spentVnd,
                amount: updated.amount,
                action: CONSTANTS.EntityConst.WALLET_HISTORY.ACTION.SWAP_REX,
                actionId: order.length >0 && order[0]._id,
                note: 'order',
                status: CONSTANTS.EntityConst.WALLET_HISTORY.STATUS.COMPLETED,
            }], opts)
        })

        return order
    }

    fulfillOrder = async ({userId, quantity, expiry, pair, type}) => {
        // TODO: consider for gas fee
        // check user
        try {
            let market = await this.model.Market.findOne({market: CONSTANTS.Market.MARKET.SWAP})
            if (!market || !market.pair || !market.pair.asset || !market.pair.base || !market.active)
                throw RestError.NewNotAcceptableError('MARKET_CONFIG_INVALID', 400, [{market}])

            let order = undefined
            if (pair == CONSTANTS.Market.PAIR.USDR_USDT) {
                //USDR-VND (+- vnd user balance, transfer bre to/from owner via sc)
                if (type == CONSTANTS.Market.ORDER.SELL) {
                    order = await this._sellTokenToUsdt({market, userId, quantity})
                } else {
                    order = await this._buyTokenByUsdt({market, userId, quantity})
                }
            } else if (pair == CONSTANTS.Market.PAIR.USDR_VND) {
                //USDR-USDT (+- usdt user balance, transfer bre to/from owner via sc)
                if (type == CONSTANTS.Market.ORDER.SELL) {
                    order = await this._sellTokenToVnd({market, userId, quantity})
                } else {
                    order = await this._buyTokenByVnd({market, userId, quantity})
                }
            }  else if (pair == CONSTANTS.Market.PAIR.REX_VND) {
                if (type == CONSTANTS.Market.ORDER.SELL) {
                    order = await this._sellRexToVnd({market, userId, quantity})
                } else {
                    order = await this._buyRexByVnd({market, userId, quantity})
                }
            }

            // add to queue
            console.log(order)
            if (order && order.length >= 1) await Queue.add(QUEUE_NAME.CONTRACT_SWAP_TOKEN, {order_id: order[0]._id})
            return order && order.length && order[0]
        } catch (error) {
            throw error
        }
    }

    getOrders = async ({base, page = 1, limit = 20, status}) => {
        try {
            const query = {market: CONSTANTS.Market.MARKET.SWAP}
            status && (query.status = status)
            base && (query['pair.base'] = base)
            limit = Number(limit)
            const offset = (page - 1) * limit
            let data = await this.model.Market.getModel()
                .find(query)
                .sort({updatedAt: -1})
                .limit(Number(limit))
                .skip(offset)
                .lean()

            for(const m of data) {
                const vndRate = await getVndRate()

                if(m.pair.asset == CONSTANTS.Market.SYMBOL.REX && m.pair.base == CONSTANTS.Market.SYMBOL.VND) {
                    const priceSetting = await this._getRexPrice()
                    console.log({priceSetting})
                    m.ask = round(priceSetting.value.price * vndRate, 2)
                    m.bid = round(priceSetting.value.price * (1 - priceSetting.value.spread) * vndRate, 2)
                } else if(m.pair.asset == CONSTANTS.Market.SYMBOL.REX && m.pair.base == CONSTANTS.Market.SYMBOL.USDT) {
                    const priceSetting = await this._getRexPrice()
                    console.log({priceSetting})
                    m.ask = round(priceSetting.value.price, 6)
                    m.bid = round(priceSetting.value.price * (1 - priceSetting.value.spread), 6)
                } else if(m.pair.asset == CONSTANTS.Market.SYMBOL.USDR && m.pair.base == CONSTANTS.Market.SYMBOL.USDT) {
                    m.ask = 1.01
                    m.bid = 0.99
                } else if(m.pair.asset == CONSTANTS.Market.SYMBOL.USDR && m.pair.base == CONSTANTS.Market.SYMBOL.VND) {
                    m.ask = round(1.01 * vndRate, 2)
                    m.bid = round(0.99 * vndRate, 2)
                } else {
                }
            }

            return data
        } catch (error) {
            throw error
        }
    }

    getHistory = async ({userId, page = 1, limit = 20, status, asUser}) => {
        try {
            const markets = await this.getMarkets(CONSTANTS.Market.MARKET.SWAP)
            limit = Number(limit)
            const offset = (page - 1) * limit
            const query = {market: {$in: markets.map((m) => m._id)}}
            status && (query.status = status)
            if(asUser !== 'all') {
                query.owner = userId
            }
            let data = await this.model.Order.getModel()
                .find(query)
                .sort({updatedAt: -1})
                .limit(Number(limit))
                .skip(offset)
                .populate('market')
                .lean()

            return data
        } catch (error) {
            throw error
        }
    }
}

module.exports = SwapMarketAction
