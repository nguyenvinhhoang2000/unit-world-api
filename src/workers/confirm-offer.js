const Scheduler = require('../services/scheduler')
const {SCHEDULE_NAME, CRON_JOB} = require('../constants/job.constant')
const container = require('../configs/dependencies/container')
const model = container.resolve('model')
const action = container.resolve('action')
const CONSTANTS = require('../constants')
const Utils = require('../utils')
const _ = require('lodash')
const { ContractProjectLib } = require('../services/project/RexProjectContract.lib')

const abortFailedOffer = async() => {
    const failedJobs = await model.Offer.getModel().find({
            status: CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING,
            updatedAt: { $lt: new Date(Date.now() - CONSTANTS.UtilsConst.DIFF_TIME.ONE_DAY) }
        }).limit(100)

    for(const job of failedJobs) {
        await model.Offer.getModel().findOneAndUpdate({
            _id: job._id,
            status: CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING
        }, {
            status:CONSTANTS.EntityConst.PROJECT.STATUS.FAILED,
            note : 'timedout'
        })
    }
}

const finalizeAddOffer = async() => {
    const processingJobs = await model.Offer.getModel().find({
        status: CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING,
        updatedAt: { $gt: new Date(Date.now() - CONSTANTS.UtilsConst.DIFF_TIME.ONE_DAY) }
    }).limit(100)

    console.log(`[ConfirmOffer] found ${processingJobs.length} jobs is in processing`)
    for(const job of processingJobs) {
        console.log({job})
        const decodedTx = await ContractProjectLib.getTransactionLogs(job.txid, 'AddBuyerOffer', {symbol: job.symbol})
        console.log(decodedTx)
        if(!decodedTx || !decodedTx.returnValues) {
            continue
        }
        const offerIndex = decodedTx.returnValues.offerIndex
        job.index = Number(offerIndex)
        job.status = CONSTANTS.EntityConst.PROJECT.STATUS.FINISHED
        await job.save()
        console.log(`Add offer via contract successfully at ${job.txid}`)
    }
}

module.exports = () => {
    console.log('Register cron jobs for confirm offer.')
    const scheduler = new Scheduler()

    scheduler.schedule(SCHEDULE_NAME.PROJECT_CONFIRM_OFFER_FINALIZE_JOB, CRON_JOB.EVERY_TWO_MINUTES_45, finalizeAddOffer)
    scheduler.schedule(SCHEDULE_NAME.PROJECT_CONFIRM_OFFER_FAILED_JOB, CRON_JOB.EVERY_EACH_HOUR, abortFailedOffer)
}
