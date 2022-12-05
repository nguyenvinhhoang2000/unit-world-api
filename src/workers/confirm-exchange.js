const Scheduler = require('../services/scheduler')
const {SCHEDULE_NAME, CRON_JOB} = require('../constants/job.constant')
const container = require('../configs/dependencies/container')
const model = container.resolve('model')
const action = container.resolve('action')
const CONSTANTS = require('../constants')
const Utils = require('../utils')
const _ = require('lodash')
const { ContractProjectLib } = require('../services/project/RexProjectContract.lib')
const { round } = require('lodash')

const abortFailedExchange = async() => {
    const failedJobs = await model.Order.getModel().find({
            symbol: {
                $in: [
                    CONSTANTS.Market.PAIR.STOCK_USDR, 
                    CONSTANTS.Market.PAIR.STOCK_VND,
                ]
            },
            $or: [ {
                    status: CONSTANTS.EntityConst.PROJECT.STATUS.FAILED
                }, {
                    status: CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING,
                    updatedAt: { $lt: new Date(Date.now() - CONSTANTS.UtilsConst.DIFF_TIME.TWELVE_HOUR) }
                } ]
        }).populate('orderbook').limit(100)

    for(const job of failedJobs) {
        console.log(job)
        if(job.charging_method != 'built-in') {
            await model.Order.getModel().findOneAndUpdate({
                    _id: job._id,
                    status: { $in: [
                        CONSTANTS.EntityConst.ORDER.STATUS.PROCESSING,
                        CONSTANTS.EntityConst.ORDER.STATUS.FAILED
                    ] }
                },
                {status: CONSTANTS.Market.ORDER_STATUS.DISPUTE}
            )
            console.log(`[confirm-exchange] Don't refund mark dispute`)

            continue
        }

        let wallet = undefined
        let amount = 0
        let cash = undefined
        if(job.type == CONSTANTS.Market.ORDER.BUY) {
            amount = round(job.quantity * job.price, 2)
            if(job.symbol.includes(CONSTANTS.TokenConst.TOKEN.VND)) {
                wallet = action.Wallet.vndw
                cash = CONSTANTS.TokenConst.TOKEN.VND
            } else if(job.symbol.includes(CONSTANTS.TokenConst.TOKEN.USDR)) {
                wallet = action.Wallet.usdrw
                cash = CONSTANTS.TokenConst.TOKEN.USDR
            } else {
                console.log(`[confirm-exchange] unknown cash symbol type`)
                continue
            }

         
            console.log(`[confirm-exchange] refund for user ${job.owner} amount ${amount} ${cash}`)
            await wallet.add(job.owner, amount, async (opts) => {

                // update for orderbook
                const orderBook = await model.OrderBook.getModel().findOne({_id: job.orderbook._id})
                if(!orderBook) {
                    throw new Error(`orderbook ${job.orderbook._id} not found`)
                }
                orderBook.executed_qty -= job.quantity
                orderBook.status = CONSTANTS.Market.ORDER_STATUS.OPEN
                await orderBook.save(opts)
               
                // update for order
                const found = await model.Order.getModel().findOneAndUpdate({
                        _id: job._id,
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
                    throw new Error(`order ${job._id} status ${job.status} != PC or F`)
                }


            })
        } else {
            wallet = action.Wallet.stockw
  
            console.log(`[confirm-exchange] refund for user ${job.owner} amount ${job.quantity} STOCK ${job.orderbook.project}`)
            await wallet.add(job.owner, job.orderbook.project, job.quantity, async (opts) => {

                // update for orderbook
                const orderBook = await model.OrderBook.getModel().findOne({_id: job.orderbook._id})
                if(!orderBook) {
                    throw new Error(`orderbook ${job.orderbook._id} not found`)
                }
                orderBook.executed_qty -= job.quantity
                orderBook.status = CONSTANTS.Market.ORDER_STATUS.OPEN
                await orderBook.save(opts)

                // update for order
                const found = await model.Order.getModel().findOneAndUpdate({
                        _id: job._id,
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
                    throw new Error(`order ${job._id} status ${job.status} != PC or F`)
                }
            })
        }

    }
}

const finalizeExchange = async() => {
    const processingJobs = await model.Order.getModel().find({
        status: CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING,
        symbol: CONSTANTS.Market.PAIR.STOCK_VND,
        updatedAt: { $gt: new Date(Date.now() - CONSTANTS.UtilsConst.DIFF_TIME.TWELVE_HOUR) }
    }).populate('orderbook').limit(100).lean()

    console.log(`[ConfirmExchange] found ${processingJobs.length} jobs is in processing`)
    for(const job of processingJobs) {
        const eventName = 'ExchangeP2pStockFiat' // 'ExchangeStock'
        const decodedTx = await ContractProjectLib.getTransactionLogs(job.msg, eventName, {symbol: job.symbol})
        console.log(decodedTx)
        if(!decodedTx || !decodedTx.returnValues) {
            continue
        }

        const order = job
        
        const price = order.charging_method === 'built-in'? round(order.quantity * order.price): 0
        if(job.type == CONSTANTS.Market.ORDER.BUY) {
            // add stock to taker, cash to maker
            await action.Wallet.vndw.add(order.orderbook.owner, price, async (opts) => {
                await action.Wallet.stockw.add(order.owner, order.project, order.quantity, async (opts1) => {
                    await model.Order.getModel().findOneAndUpdate(
                        {
                            _id: order._id,
                            status: CONSTANTS.Market.ORDER_STATUS.PROCESSING,
                        },
                        {status: CONSTANTS.Market.ORDER_STATUS.FULFILLED},
                        opts1,
                    )
                    // update for orderbook
                    if(order.orderbook.executed_qty >= order.orderbook.quantity) {
                        await model.OrderBook.getModel().findOneAndUpdate({
                            _id: order.orderbook._id
                        }, {
                            status: CONSTANTS.Market.ORDER_STATUS.CLOSE
                        }, opts1)
                    }
                }, opts.session)
            })
        } else {
            // add cash to taker, stock to maker
            await action.Wallet.vndw.add(order.owner, price, async (opts) => {
                await action.Wallet.stockw.add(order.orderbook.owner, order.orderbook.project, order.quantity, async (opts1) => {
                    await model.Order.getModel().findOneAndUpdate(
                        {
                            _id: order._id,
                            status: CONSTANTS.Market.ORDER_STATUS.PROCESSING,
                        },
                        {status: CONSTANTS.Market.ORDER_STATUS.FULFILLED},
                        opts1,
                    )
                    // update for orderbook
                    if(order.orderbook.executed_qty >= order.orderbook.quantity) {
                        await model.OrderBook.getModel().findOneAndUpdate({
                            _id: order.orderbook._id
                        }, {
                            status: CONSTANTS.Market.ORDER_STATUS.CLOSE
                        }, opts1)
                    }
                }, opts.session)
            })
        }
        
        console.log(`Exchange contract successfully at ${job.msg}`)
    }
}

module.exports = () => {
    console.log('Register cron jobs for confirm vote.')
    const scheduler = new Scheduler()

    scheduler.schedule(SCHEDULE_NAME.PROJECT_CONFIRM_EXCHANGE_FINALIZE_JOB, CRON_JOB.EVERY_TWO_MINUTES_45, finalizeExchange)
    scheduler.schedule(SCHEDULE_NAME.PROJECT_CONFIRM_EXCHANGE_FAILED_JOB, CRON_JOB.EVERY_FIVE_MINUTES_30, abortFailedExchange)
}
