const Scheduler = require('../services/scheduler')
const {SCHEDULE_NAME, CRON_JOB} = require('../constants/job.constant')
const container = require('../configs/dependencies/container')
const model = container.resolve('model')
const action = container.resolve('action')
const CONSTANTS = require('../constants')
const Utils = require('../utils')
const _ = require('lodash')
const {getConfirmations} = require('../services/web3/bsc/bsc')
const Queue = require('../services/queue')
const { ContractProjectLib } = require('../services/project/RexProjectContract.lib')

let market = null

const abortFailedIdoOrder = async() => {
    if(!market) {
        market = await model.Market.findOne({market: CONSTANTS.Market.MARKET.IDO})
        if (!market || !market.pair || !market.pair.asset || !market.pair.base || !market.active)
            throw Utils.RestError.NewNotAcceptableError('MARKET_CONFIG_INVALID', 400, [{market}])
    }


    const failedJobs = await model.Order.getModel().find({
        $or: [
            {
                status: CONSTANTS.Market.ORDER_STATUS.FAILED,
                market: market._id
            },
            {
                status: CONSTANTS.Market.ORDER_STATUS.PROCESSING,
                updatedAt: { $lt: new Date(Date.now() - CONSTANTS.UtilsConst.DIFF_TIME.ONE_DAY) }
            }
        ]
    }).limit(100)

    for(const order of failedJobs) {
        // update stock circulating_supply
        const existingProject = await model.Project.getModel().findOne({
            _id: order.project
        }).populate('stock_info').lean()
        if(!existingProject || !existingProject.stock_info) {
            console.error(`[process-ido] cannot found project ${order.project}`)
            continue
        }
        const stockId = existingProject.stock_info._id
        // Refund usdr in case error
        const amount = _.round(order.price * order.quantity, 6)
        console.log(`Refund USDR stable token to user`)
        await action.Wallet.usdrw.add(order.owner, amount, async (opts) => {
            await model.Order.getModel().findOneAndUpdate(
                {
                    _id: order._id,
                    status: CONSTANTS.Market.ORDER_STATUS.FAILED,
                },
                {status: CONSTANTS.Market.ORDER_STATUS.REFUND},
                opts,
            )
            

            await model.Stock.getModel().findOneAndUpdate({
                _id: stockId,
                project: existingProject._id
            }, {
                $inc: {
                    circulating_supply: -order.quantity
                }
            }, opts)
        })

        console.log(`Refund USDR stable token to user=${amount}`)
        console.log(`Return stock ${existingProject.no}=${order.quantity}`)
    }
}

const finalizeIdoJob = async({seedTime, trigger=false, jobId=null}) => {
    if(!market) {
        market = await model.Market.findOne({market: CONSTANTS.Market.MARKET.IDO})
        if (!market || !market.pair || !market.pair.asset || !market.pair.base || !market.active)
            throw Utils.RestError.NewNotAcceptableError('MARKET_CONFIG_INVALID', 400, [{market}])
    }
    console.log(`[confirm-buy-ido]`, {seedTime, trigger, jobId})

    let processingOrders = []
    
    if(!jobId) {
        processingOrders = await model.Order.getModel().find({
            status: CONSTANTS.Market.ORDER_STATUS.PROCESSING,
            market: market._id,
            updatedAt: { $gt: new Date(Date.now() - CONSTANTS.UtilsConst.DIFF_TIME.TWELVE_HOUR) }
        }).limit(100)
    } else {
        processingOrders = await model.Order.getModel().find({
            _id: jobId
        })
    }

    for(const order of processingOrders) {
        const txid = order.msg

        const eventName = 'BuyIdo'
        const decodedTx = await ContractProjectLib.getTransactionLogs(txid, eventName)
        console.log(decodedTx)
        if(!decodedTx || !decodedTx.returnValues) {
            continue
        }

        await action.Wallet.stockw.add(order.owner, order.project, order.quantity, async (opts) => {
            const updated = await model.Order.getModel().findOneAndUpdate(
                {
                    _id: order._id,
                    status: CONSTANTS.Market.ORDER_STATUS.PROCESSING,
                },
                {status: CONSTANTS.Market.ORDER_STATUS.FULFILLED},
                opts,
            )
            if(!updated) {
                throw new Error('IDO order already fulfilled')
            }
        })

        console.log(`Buy IDO via contract successfully at ${txid}`)
    }
}

module.exports = () => {
    console.log('Register cron jobs.')
    const scheduler = new Scheduler()

    scheduler.scheduleSeed(SCHEDULE_NAME.PROJECT_CONFIRM_IDO_FINALIZE_JOB, CRON_JOB.EVERY_FIVE_MINUTES_50)
    Queue.register(SCHEDULE_NAME.PROJECT_CONFIRM_IDO_FINALIZE_JOB, finalizeIdoJob)


    scheduler.schedule(SCHEDULE_NAME.PROJECT_CONFIRM_IDO_FAILED_JOB, CRON_JOB.EVERY_EACH_HOUR, abortFailedIdoOrder)
}
