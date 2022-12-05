const Scheduler = require('../services/scheduler')
const {SCHEDULE_NAME, CRON_JOB, QUEUE_NAME} = require('../constants/job.constant')
const container = require('../configs/dependencies/container')
const model = container.resolve('model')
const action = container.resolve('action')
const CONSTANTS = require('../constants')
const Utils = require('../utils')
const _ = require('lodash')
const { getWeb3 } = require('../services/web3')
const { RexProjectContract } = require('../services/project')
const { getLatestBlockNumber } = require('../services/web3/bsc/bsc')
const { ContractProjectLib } = require('../services/project/RexProjectContract.lib')
const { round } = require('lodash')
const Queue = require('../services/queue')

const getStatus = (startTime, endTime, lockedTime, isSold, isDistributed, isRefunded) => {
    if(isDistributed) return CONSTANTS.EntityConst.PROJECT.STATUS.DISTRIBUTED
    if(isRefunded) return CONSTANTS.EntityConst.PROJECT.STATUS.REFUNDED
    if(isSold) return CONSTANTS.EntityConst.PROJECT.STATUS.SOLD

    const now = round(Date.now()/1000)
    
    if(now >= endTime) return CONSTANTS.EntityConst.PROJECT.STATUS.FINISHED
    if(now >= (endTime + lockedTime)) return CONSTANTS.EntityConst.PROJECT.STATUS.RELEASED

    return CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING
}

const syncProject = async({seedTime, trigger=false, projectId=null}) => {
    console.log(`[syncProject]`, {seedTime, trigger, projectId})
    let recentProjects = []
    
    if(projectId) {
        recentProjects = await model.Project.getModel().find({
            _id: projectId
        }).select('_id no is_sold is_distributed is_refunded accept_offer total_claim_value total_claimed status').lean()
    } else {
        recentProjects = await model.Project.getModel().find({
            status: {
                $in: [
                    CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING,
                    CONSTANTS.EntityConst.PROJECT.STATUS.FINISHED,
                    CONSTANTS.EntityConst.PROJECT.STATUS.RELEASED,
                    CONSTANTS.EntityConst.PROJECT.STATUS.SOLD,
                    CONSTANTS.EntityConst.PROJECT.STATUS.DISTRIBUTED,
                    CONSTANTS.EntityConst.PROJECT.STATUS.REFUNDED,
                ]
            },
            updatedAt: { $gt: new Date(Date.now() - CONSTANTS.UtilsConst.DIFF_TIME.ONE_HOUR) }
        }).limit(100).select('_id no is_sold is_distributed is_refunded accept_offer total_claim_value total_claimed status').lean()    
    }

    for(const project of recentProjects) {
        const projectDetail = await ContractProjectLib.getProject(project.no)

        const { 
            symbol, 
            lockedTime, 
            startTime, 
            endTime, 
            expectedInterestRate, 
            isSold, 
            isDistributed, 
            isRefunded, 
            acceptOffer,
            totalClaimValue,
            totalClaimed
         } = projectDetail || {}

        const status = getStatus(startTime, endTime, lockedTime, isSold, isDistributed, isRefunded)

        console.log({status})
        if(project.is_sold === isSold &&
            project.is_distributed === isDistributed && 
            project.is_refunded === isRefunded && 
            project.accept_offer === Number(acceptOffer) && 
            project.total_claim_value === Number(totalClaimValue) && 
            project.total_claimed === Number(totalClaimed) &&
            project.status === status) {
                continue
            }

        const updatingData = {
            is_sold: isSold,
            is_distributed: isDistributed,
            is_refunded: isRefunded,
            accept_offer: acceptOffer,
            total_claim_value: totalClaimValue,
            total_claimed: totalClaimed,
            status
        }
        console.log(`[syncProject] sync new project data`, updatingData)
        await model.Project.getModel().findOneAndUpdate({
            _id: project._id,
            no: symbol
        }, updatingData)

        await new Promise(r => setTimeout(r, 2000));
    }
}

module.exports = () => {
    console.log('Register cron jobs sync project detail.')
    const scheduler = new Scheduler()

    scheduler.scheduleSeed(SCHEDULE_NAME.SYNC_PROJECT, CRON_JOB.EVERY_FIVE_MINUTES_40)
    Queue.register(SCHEDULE_NAME.SYNC_PROJECT, syncProject)
}
