const Utils = require('../utils')
const CONSTANTS = require('../constants')
const {Lang, EntityConst} = CONSTANTS
const {RestError} = require('../utils')
const {ContractTokenLib} = require('../services/project/UsdrTokenContract.lib')
const WalletAction = require('./wallet')
const { RexTokenContract } = require('../services/project')
const { RexTokenLib } = require('../services/project/RexTokenContract.lib')
const Queue = require('../services/queue')
const { SCHEDULE_NAME } = require('../constants/job.constant')
const { getEnv } = require('../utils/getEnv.util')
const OWNER_ADDRESS = getEnv('OWNER_ADDRESS')

class ContractUsdrAction {
    constructor(opts) {
        this.model = opts.model
        this.wallet = WalletAction.getInstance(opts)
    }

    buyToken = async (order) => {
        // mint bre (already charge wallet point)
        try {
            const bcwallet = await this.model.BcWallet.findOne({user: order.owner, inactive: false})
            if (!bcwallet) {
                console.error(`bcwallet of ${order._id} not found`)
                return
            }
            const data = {
                toAddress: bcwallet.address,
                amount: Utils.Token.normalizeTokenAmount(order.quantity),
            }

            let updateContract = undefined
            if(order.symbol === CONSTANTS.Market.PAIR.REX_VND || order.symbol === CONSTANTS.Market.PAIR.REX_USDT) {
                //updateContract = await RexTokenLib.mintTo(data)
                updateContract = await RexTokenLib.transfer({
                    recipient: bcwallet.address,
                    amount: Utils.Token.normalizeTokenAmount(order.quantity)
                })
            } else {
                updateContract = await ContractTokenLib.issue(data)
            }
            
            if (!updateContract) throw RestError.NewInternalServerError('Failed to issue new token')

            await this.model.Order.getModel().findOneAndUpdate(
                {_id: order._id},
                {status: CONSTANTS.Market.ORDER_STATUS.PROCESSING, msg: updateContract.transactionHash},
            )

            console.log(`Issue new token successfully at ${updateContract.transactionHash}`)
        } catch (error) {
            // mark failed waiting for refund offchain
            await this.model.Order.getModel().findOneAndUpdate(
                {_id: order._id, status: CONSTANTS.Market.ORDER_STATUS.PENDING},
                {status: CONSTANTS.Market.ORDER_STATUS.FAILED, msg: error.message},
            )
            console.log(error.message)
        } finally {
            Queue.trigger(SCHEDULE_NAME.CONFIRM_SWAP_FINALIZE_JOB, {jobId: order._id})
        }
    }

    sellToken = async (order) => {
        // burn bre
        try {
            const bcwallet = await this.model.BcWallet.findOne({user: order.owner, inactive: false})
            if (!bcwallet) {
                console.error(`bcwallet of ${order._id} not found`)
                return
            }
            const data = {
                fromAddress: bcwallet.address,
                amount: Utils.Token.normalizeTokenAmount(order.quantity),
            }
            let updateContract = undefined
            if(order.symbol === CONSTANTS.Market.PAIR.REX_VND || order.symbol === CONSTANTS.Market.PAIR.REX_USDT) {
                updateContract = await RexTokenLib.transfer({
                    recipient: OWNER_ADDRESS,
                    amount: Utils.Token.normalizeTokenAmount(order.quantity),
                    address: bcwallet.address,
                    privateKey: Utils.Encrypt.decrypt(bcwallet.private_key)
                })
            } else {
                updateContract = await ContractTokenLib.burn(data)
            }
            if (!updateContract) throw RestError.NewInternalServerError('Failed to burn token')

            await this.model.Order.getModel().findOneAndUpdate(
                {_id: order._id},
                {status: CONSTANTS.Market.ORDER_STATUS.PROCESSING, msg: updateContract.transactionHash},
            )
            console.log(`Burn token successfully at ${updateContract.transactionHash}`)
        } catch (error) {
            // mark failed waiting for refund offchain
            await this.model.Order.getModel().findOneAndUpdate(
                {_id: order._id, status: CONSTANTS.Market.ORDER_STATUS.PENDING},
                {status: CONSTANTS.Market.ORDER_STATUS.FAILED, msg: error.message},
            )
            console.log(error.message)
        } finally {
            Queue.trigger(SCHEDULE_NAME.CONFIRM_SWAP_FINALIZE_JOB, {jobId: order._id})
        }
    }
}

module.exports = ContractUsdrAction
