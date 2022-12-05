const Scheduler = require('../services/scheduler')
const {SCHEDULE_NAME, CRON_JOB} = require('../constants/job.constant')
const container = require('../configs/dependencies/container')
const model = container.resolve('model')
const action = container.resolve('action')
const CONSTANTS = require('../constants')
const Utils = require('../utils')
const _ = require('lodash')
const { ContractProjectLib } = require('../services/project/RexProjectContract.lib')
const Queue = require('../services/queue')

const abortFailedVote = async() => {
    const failedJobs = await model.Vote.getModel().find({
            status: CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING,
            updatedAt: { $lt: new Date(Date.now() - CONSTANTS.UtilsConst.DIFF_TIME.TWELVE_HOUR) }
        }).limit(100)

    for(const job of failedJobs) {
        await model.Vote.getModel().findOneAndUpdate({
            _id: job._id,
            status: CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING
        }, {
            status:CONSTANTS.EntityConst.PROJECT.STATUS.FAILED,
            note : 'timedout'
        })
    }
}

const finalizeVote = async() => {
    const processingJobs = await model.Vote.getModel().find({
        status: CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING,
        updatedAt: { $gt: new Date(Date.now() - CONSTANTS.UtilsConst.DIFF_TIME.TWELVE_HOUR) }
    }).limit(100)

    console.log(`[ConfirmVote] found ${processingJobs.length} jobs is in processing`)
    for(const job of processingJobs) {
        const eventName = job.cancelled === true? 'CanceledVote' : job.result === true? 'VoteAccepted' : 'VoteRejected'
        const decodedTx = await ContractProjectLib.getTransactionLogs(job.txid, eventName, {symbol: job.symbol})
        console.log(decodedTx)
        if(!decodedTx || !decodedTx.returnValues) {
            continue
        }
        job.time = decodedTx.returnValues.time
        job.status = CONSTANTS.EntityConst.PROJECT.STATUS.FINISHED
        await job.save()

        await model.Project.getModel().findOneAndUpdate({_id: job.project}, {updatedAt: new Date()})
        Queue.trigger(SCHEDULE_NAME.SYNC_PROJECT, {projectId: job.project})


        console.log(`Voting via contract successfully at ${job.txid}`)
    }
}

module.exports = () => {
    console.log('Register cron jobs for confirm vote.')
    const scheduler = new Scheduler()

    scheduler.schedule(SCHEDULE_NAME.PROJECT_CONFIRM_VOTE_FINALIZE_JOB, CRON_JOB.EVERY_TWO_MINUTES_30, finalizeVote)
    scheduler.schedule(SCHEDULE_NAME.PROJECT_CONFIRM_VOTE_FAILED_JOB, CRON_JOB.EVERY_EACH_HOUR, abortFailedVote)
}
