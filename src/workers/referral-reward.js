const Scheduler = require('../services/scheduler')
const {SCHEDULE_NAME, CRON_JOB} = require('../constants/job.constant')
const CONSTANTS = require('../constants')
const container = require('../configs/dependencies/container')
const model = container.resolve('model')
const action = container.resolve('action')
const { RexTokenLib } = require('../services/project/RexTokenContract.lib')
const { DIFF_TIME } = require('../constants/utils.constant')
const { normalizeTokenAmount } = require('../utils/token.util')

let marketId = null
const scanIdoInvestmentReward = async () => {
    try {
        const market = marketId
            ? marketId
            : await model.Market.getModel().findOne({
                  market: CONSTANTS.Market.MARKET.IDO,
                  active: true,
              })
        if (!market) throw new Error('[WORKER][REFERRAL] Market IDO not found')
        marketId = market._id

        const buyIdoList = await model.Transaction.getModel().find({
            type: CONSTANTS.Market.ORDER.BUY,
            market: marketId,
            status: CONSTANTS.Market.ORDER_STATUS.FULFILLED,
        })
        if (!buyIdoList || buyIdoList.length == 0) {
            console.log(`[WORKER][REFERRAL] ido investment all rewarded`)
        }

        for (const order of buyIdoList) {
            await action.Referral.rewardDueToBuyIdo({
                orderId: order._id,
                stableAmount: (order.price * order.quantity).toFixed(5),
                note: `reward due to buy IDO at order ${order._id}`,
            })
        }
    } catch (error) {
        console.error(`[WORKER][REFERRAL] error `, error.message)
    }
}


const scanRegistrationReward = async () => {
    try {
        const referrals = await model.Referral.getModel().find({
            register_reward: 0
        }).limit(100).lean()

        for(const ref of referrals) {
            await action.Referral.rewardDueToRegistration({
                userId: ref.user,
                note: `reward due to registration from ${ref.user}`
            })
        }
    } catch (error) {
        console.error(`[WORKER][REFERRAL] error `, error.message)
    }
}

const bountyCompletionReward = async() => {
    const processingJobs = await model.BountyCompletion.getModel().find({
        status: CONSTANTS.EntityConst.BOUNTY.COMPLETION_STATUS.REWARDING,
        createdAt: { $gt: new Date(Date.now() - DIFF_TIME.ONE_DAY )}
    }).populate('bounty')

    for(const job of processingJobs) {
        const rewardTx = job.rewardTx

        const decodedTx = await RexTokenLib.getTransactionLogs(rewardTx, 'Transfer')
        if(!decodedTx || !decodedTx.returnValues) {
            continue
        }

        await action.Wallet.rexw.add(job.user, job.bounty.rexReward, async (opts) => {
            const found = await await model.BountyCompletion.getModel().findOneAndUpdate({
                    _id: job._id,
                    status: CONSTANTS.EntityConst.BOUNTY.COMPLETION_STATUS.REWARDING,
                },
                {status: CONSTANTS.EntityConst.BOUNTY.COMPLETION_STATUS.REWARDED},
                opts,
            )
            if(!found) {
                throw new Error(`bounty completion ${job._id} status ${job.status} != REWARDING`)
            }
        })
    }

    const pendingJobs = await model.BountyCompletion.getModel().find({
        status: CONSTANTS.EntityConst.BOUNTY.COMPLETION_STATUS.REQUEST_REWARD,
        createdAt: { $gt: new Date(Date.now() - DIFF_TIME.ONE_DAY )}
    }).populate('bounty')

    for(const job of pendingJobs) {
        const bcWallet = await model.BcWallet.findOne({user: job.user, inactive: false})
        if (!bcWallet) {
            console.error(`bcWallet of user ${job.user} not found`)
            return
        }

        const receipt = await RexTokenLib.transfer({
            recipient: bcWallet.address,
            amount: normalizeTokenAmount(job.bounty.rexReward)
        })

        if(receipt && receipt.transactionHash) {
            console.log(receipt)
            job.rewardTx = receipt.transactionHash,
            job.status = CONSTANTS.EntityConst.BOUNTY.COMPLETION_STATUS.REWARDING
            await job.save()
        }
    }
}

module.exports = () => {
    console.log('Register cron jobs for referral reward')
    const scheduler = new Scheduler()

    //scheduler.schedule(SCHEDULE_NAME.REFERRAL_REWARD, CRON_JOB.EVERY_FIVE_MINUTES, scanIdoInvestmentReward)
    scheduler.schedule(SCHEDULE_NAME.REFERRAL_REGISTRATION_REWARD, CRON_JOB.EVERY_EACH_HOUR, scanRegistrationReward)
    scheduler.schedule(SCHEDULE_NAME.BOUNTY_COMPLETION_REWARD, CRON_JOB.EVERY_TWO_MINUTES_30, bountyCompletionReward)
}
