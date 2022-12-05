const Scheduler = require('../services/scheduler')
const {SCHEDULE_NAME, CRON_JOB} = require('../constants/job.constant')
const container = require('../configs/dependencies/container')
const model = container.resolve('model')
const action = container.resolve('action')
const CONSTANTS = require('../constants')
const Utils = require('../utils')
const _ = require('lodash')
const { ContractProjectLib } = require('../services/project/RexProjectContract.lib')
const { weiToEther } = require('../utils/token.util')
const Queue = require('../services/queue')
const { round } = require('lodash')
const { RexTokenLib } = require('../services/project/RexTokenContract.lib')
const { ContractTokenLib } = require('../services/project/UsdrTokenContract.lib')
let markets = null

const TransferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

const abortFailedSwap = async() => {
    const failedJobs = await model.Order.getModel().find({
            symbol: {
                $in: [
                    CONSTANTS.Market.PAIR.REX_USDT,
                    CONSTANTS.Market.PAIR.REX_VND,
                    CONSTANTS.Market.PAIR.USDR_USDT,
                    CONSTANTS.Market.PAIR.USDR_VND,
                ]
            },
            $or: [ {
                    status: CONSTANTS.EntityConst.ORDER.STATUS.PROCESSING,
                    updatedAt: { $lt: new Date(Date.now() - CONSTANTS.UtilsConst.DIFF_TIME.TWELVE_HOUR) }
                }, {
                    status: CONSTANTS.EntityConst.ORDER.STATUS.FAILED
                }
            ]
        }).limit(100)

    // refund
    let wallet = null
    let amount = null
    for(const order of failedJobs) {
        if(order.type == CONSTANTS.Market.ORDER.BUY) {
            amount = round(order.quantity * order.price, 2)
            if(order.symbol.includes(CONSTANTS.TokenConst.TOKEN.VND)) {
                wallet = action.Wallet.vndw
            } else if(order.symbol.includes(CONSTANTS.TokenConst.TOKEN.USDT)) {
                wallet = action.Wallet.usdtw
            } else {
                console.log(`[confirm-swap] unknown cash symbol type`)
                continue
            }
        } else {
            amount = order.quantity
            if(order.symbol.includes(CONSTANTS.TokenConst.TOKEN.REX)) {
                wallet = action.Wallet.rex
            } else if(order.symbol.includes(CONSTANTS.TokenConst.TOKEN.USDR)) {
                wallet = action.Wallet.usdrw
            } else {
                console.log(`[confirm-swap] unknown token symbol type`)
                continue
            }
        }

        console.log(`[confirm-swap] refund for user ${order.owner} amount ${amount}`)
        wallet.add(order.owner, amount, async (opts) => {
            const found = await model.Order.getModel().findOneAndUpdate({
                    _id: order._id,
                    status: { $in: [
                        CONSTANTS.EntityConst.ORDER.STATUS.PROCESSING,
                        CONSTANTS.EntityConst.ORDER.STATUS.FAILED
                    ] }
                },
                {status: CONSTANTS.Market.ORDER_STATUS.REFUND},
                opts,
            )
            console.log(found)
            if(!found) {
                throw new Error(`order ${order._id} status ${order.status} != PC or F`)
            }
        })
    }
}

const finalizeSwap = async({seedTime, trigger=false, jobId=null}) => {
    if(!markets) {
        markets = await model.Market.getModel().find({market: CONSTANTS.Market.MARKET.SWAP})
        if (!markets || !markets.length == 0) return
    }
    console.log(`[confirm-swap]`, {seedTime, trigger, jobId})

    let processingJobs = []
    if(!jobId) {
        processingJobs = await model.Order.getModel().find({
            status: CONSTANTS.EntityConst.ORDER.STATUS.PROCESSING,
            market: { $in: markets.map(m => m._id) },
            updatedAt: { $gt: new Date(Date.now() - (CONSTANTS.UtilsConst.DIFF_TIME.TWELVE_HOUR)) }
        }).limit(100)
    } else {
        processingJobs = await model.Order.getModel().find({
            _id: jobId,
            status: CONSTANTS.EntityConst.ORDER.STATUS.PROCESSING
        })
    }

    // credit to buyer, seller
    for(const order of processingJobs) {
        let wallet = undefined
        if(order.symbol === CONSTANTS.Market.PAIR.REX_VND || order.symbol === CONSTANTS.Market.PAIR.REX_USDT) {
            wallet = action.Wallet.rexw
        } else if(order.symbol === CONSTANTS.Market.PAIR.USDR_USDT || order.symbol === CONSTANTS.Market.PAIR.USDR_VND) {
            wallet = action.Wallet.usdrw
        } else {
            throw new Error(`unknown symbol ${order.symbol}`)
        }


        const eventName = 'Transfer'
        let decodedTx = null
        if(order.symbol.includes(CONSTANTS.TokenConst.TOKEN.REX)) {
            decodedTx = await RexTokenLib.getTransactionLogs(order.msg, eventName)
        } else if (order.symbol.includes(CONSTANTS.TokenConst.TOKEN.USDR)) {
            decodedTx = await ContractTokenLib.getTransactionLogs(order.msg, eventName)
        } else {
            continue
        }

        console.log(decodedTx)
        if(!decodedTx || !decodedTx.returnValues) {
            continue
        }

        if(order.type == CONSTANTS.Market.ORDER.BUY) {
            wallet.add(order.owner, order.quantity, async (opts) => {
                await model.Order.getModel().findOneAndUpdate(
                    {
                        _id: order._id,
                        status: CONSTANTS.Market.ORDER_STATUS.PROCESSING,
                    },
                    {status: CONSTANTS.Market.ORDER_STATUS.FULFILLED},
                    opts,
                )
            })
        } else {
            const amount = round(order.quantity * order.price, 2)
            let wallet = null
            if (order.symbol == CONSTANTS.Market.PAIR.USDR_USDT) wallet = action.Wallet.usdtw
            else if (order.symbol == CONSTANTS.Market.PAIR.REX_USDT) wallet = action.Wallet.usdtw
            else if (order.symbol == CONSTANTS.Market.PAIR.USDR_VND) wallet = action.Wallet.vndw
            else if (order.symbol == CONSTANTS.Market.PAIR.REX_VND) wallet = action.Wallet.vndw
            else throw new Error(`unknown symbol ${order.symbol}`)

            await wallet.add(order.owner, amount, async (opts) => {
                const found = await model.Order.getModel().findOneAndUpdate({
                        _id: order._id,
                        status: CONSTANTS.Market.ORDER_STATUS.PROCESSING,
                    },
                    {status: CONSTANTS.Market.ORDER_STATUS.FULFILLED},
                    opts,
                )
                if(!found) {
                    throw new Error(`order ${order._id} status ${order.status} != PC`)
                }
            })
        }
    }
}

module.exports = () => {
    console.log('Register cron jobs for confirm claim.')
    const scheduler = new Scheduler()

    scheduler.scheduleSeed(SCHEDULE_NAME.CONFIRM_SWAP_FINALIZE_JOB, CRON_JOB.EVERY_FIVE_MINUTES_20)
    Queue.register(SCHEDULE_NAME.CONFIRM_SWAP_FINALIZE_JOB, finalizeSwap)


    scheduler.schedule(SCHEDULE_NAME.CONFIRM_SWAP_FAILED_JOB, CRON_JOB.EVERY_EACH_HOUR_15, abortFailedSwap)
}
