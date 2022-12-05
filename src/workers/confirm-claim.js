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

const abortFailedClaim = async() => {
    const failedJobs = await model.ClaimReward.getModel().find({
            status: CONSTANTS.EntityConst.CLAIM.STATUS.PROCESSING,
            updatedAt: { $lt: new Date(Date.now() - CONSTANTS.UtilsConst.DIFF_TIME.TWELVE_HOUR) }
        }).limit(100)

    for(const job of failedJobs) {
        await model.ClaimReward.getModel().findOneAndUpdate({
            _id: job._id,
            status: CONSTANTS.EntityConst.CLAIM.STATUS.PROCESSING
        }, {
            status:CONSTANTS.EntityConst.CLAIM.STATUS.FAILED,
            note : 'timedout'
        })
    }
}

const finalizeClaim = async({seedTime, trigger=false, jobId=null}) => {
    console.log(`[confirm-claim]`, {seedTime, trigger, jobId})

    let processingJobs = []
    if(!jobId) {
        processingJobs = await model.ClaimReward.getModel().find({
            status: CONSTANTS.EntityConst.CLAIM.STATUS.PROCESSING,
            updatedAt: { $gt: new Date(Date.now() - (CONSTANTS.UtilsConst.DIFF_TIME.ONE_DAY*10)) }
        }).limit(100)
    } else {
        processingJobs = await model.ClaimReward.getModel().find({
            _id: jobId
        })
    }

    console.log(`[ConfirmClaim] found ${processingJobs.length} jobs is in processing`)
    for(const job of processingJobs) {
        const eventName = 'ClaimReward'
        const decodedTx = await ContractProjectLib.getTransactionLogs(job.txid, eventName, {symbol: job.symbol})
        console.log(decodedTx)
        if(!decodedTx || !decodedTx.returnValues) {
            continue
        }

        const claimedAmount = weiToEther(decodedTx.returnValues.amount)
        console.log({claimedAmount})
        const userId = job.user
        const projectId = job.project

        // subtract stock
        await action.Wallet.stockw.add(userId, projectId, -Number(decodedTx.returnValues.stockAmount), async (opts) => {
            const rewardTx = {
                type: CONSTANTS.EntityConst.TRANSACTION.TYPE.CLAIM,
                amount: -Number(decodedTx.returnValues.stockAmount),
                currency: CONSTANTS.EntityConst.TRANSACTION.CURRENCY.STOCK,
                from: undefined,
                to: userId,
                status: CONSTANTS.EntityConst.TRANSACTION.STATUS.COMPLETED,
                note: decodedTx.transactionHash,
            }
            await model.TransactionLog.getModel().create([rewardTx], opts)

            // add token
            await action.Wallet.rexw.add(userId, claimedAmount, async (opts) => {
                const rewardTx = {
                    type: CONSTANTS.EntityConst.TRANSACTION.TYPE.CLAIM,
                    amount: claimedAmount,
                    currency: CONSTANTS.EntityConst.TRANSACTION.CURRENCY.PUBLIC_TOKEN,
                    from: undefined,
                    to: userId,
                    status: CONSTANTS.EntityConst.TRANSACTION.STATUS.COMPLETED,
                    note: decodedTx.transactionHash,
                }
                await model.TransactionLog.getModel().create([rewardTx], opts)

                // Update job status
                job.amount = claimedAmount
                job.status = CONSTANTS.EntityConst.CLAIM.STATUS.FINISHED
                await job.save(opts)
    
            }, opts.session)
        })

        console.log(`Voting via contract successfully at ${job.txid}`)
    }
}

module.exports = () => {
    console.log('Register cron jobs for confirm claim.')
    const scheduler = new Scheduler()

    scheduler.scheduleSeed(SCHEDULE_NAME.PROJECT_CONFIRM_CLAIM_FINALIZE_JOB, CRON_JOB.EVERY_TWO_MINUTES_15)
    Queue.register(SCHEDULE_NAME.PROJECT_CONFIRM_CLAIM_FINALIZE_JOB, finalizeClaim)


    scheduler.schedule(SCHEDULE_NAME.PROJECT_CONFIRM_CLAIM_FAILED_JOB, CRON_JOB.EVERY_EACH_HOUR, abortFailedClaim)
}
