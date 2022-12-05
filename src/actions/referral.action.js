const Utils = require('../utils')
const CONSTANTS = require('../constants')
const WalletAction = require('./wallet')
const {RestError} = require('../utils')
const mongoose = require('mongoose')
const { getEnv } = require('../utils/getEnv.util')
const { RexTokenLib } = require('../services/project/RexTokenContract.lib')
const { encrypt } = require('../utils/encrypt.util')
const BscService = require('../services/web3/bsc/bsc')
const {Mongo} = require('../utils')

class ReferralAction {
    static instance

    static getInstance(context) {
        if (!ReferralAction.instance) {
            ReferralAction.instance = new ReferralAction(context)
        }

        return ReferralAction.instance
    }
    constructor(opts) {
        this.model = opts.model
        this.codeLength = 5
        this.wallet = WalletAction.getInstance(opts)
    }

    _generateUniqCode = async () => {
        let code = ''
        for (let i = 0; i < this.codeLength; i++) {
            code += CONSTANTS.UtilsConst.ALPHANUMERIC.charAt(Utils.Math.randomInt(62))
        }

        const existed = await this.model.Referral.findOne({code})
        if (existed) {
            throw RestError.NewNotAcceptableError('Referral code duplicated')
        }

        return code
    }

    generateCode = async (userId, referrer, session = null) => {
        // TODO: add locker
        const code = await Utils.Common.retryException(this._generateUniqCode, [userId, referrer], 10, 100)

        const newReferral = {
            user: userId,
            code,
            status: CONSTANTS.EntityConst.REFERRAL.REWARD.WAITING,
        }
        if(referrer) {
            const existingReferrer = await this.model.Referral.findOne({code: referrer})
            if (existingReferrer) newReferral['referrer'] = referrer
            else {
                throw RestError.NewBadRequestError(`referrer code not found ${referrer}`)
            }
        }
        console.log({newReferral})

        // create referall code
        return await this.model.Referral.getModel().create([newReferral], session)
    }

    reward = async ({userId, amount, note, callback, session=null}) => {
        // call reward when user buy product
        try {
            let wallet = null
            let txLog = null

            let bcWallet = await this.model.BcWallet.findOne({user: userId, inactive: false})
            if (!bcWallet) {
                const newWallet = BscService.generateAccount(process.env[`${process.env.MODE}_USER_NMEMONIC_ENABLE`])
                bcWallet = await this.model.BcWallet.createOne({
                    user: userId,
                    address: newWallet.address,
                    private_key: encrypt(newWallet.privateKey),
                    mnemonic: newWallet.mnemonic,
                    default: true,
                })
                if (!bcWallet) {
                    console.error(`bcWallet of ${userId} not found`)
                    throw new Error(`bcWallet of ${userId} not found`)
                }
            }
            const receipt = await RexTokenLib.mintTo({
                toAddress: bcWallet.address, 
                amount
            })
            if(!receipt || !receipt.transactionHash) {
                throw new Error(`Cannot mint new REX token`)
            }
            const rewardTx = {
                type: CONSTANTS.EntityConst.TRANSACTION.TYPE.REWARD,
                amount,
                currency: CONSTANTS.EntityConst.TRANSACTION.CURRENCY.PUBLIC_TOKEN,
                from: undefined,
                to: userId,
                status: CONSTANTS.EntityConst.TRANSACTION.STATUS.COMPLETED,
                note: receipt.transactionHash,
            }
            txLog = await this.model.TransactionLog.getModel().create([rewardTx], {session})

            return {txLog, wallet}
        } catch (error) {
            console.log(`[ReferralController] ${error.message}`)
            throw error
        }
    }

    _getReferrerId = async (userId) => {
        const referral = await this.model.Referral.getModel().findOne({user: userId})
        console.log(`[Referral] reward due to`, referral)
        if (!referral) throw Utils.RestError.NewInternalServerError('USER_REFERRAL_INVALID')

        if (!referral.referrer) {
            console.log(`[Referral] user has no referrer`)
            return null
        }

        const referrer = await this.model.Referral.getModel().findOne({code: referral.referrer})
        if (!referrer) {
            console.log(`[Referral] referrer code ${referral.referrer} not found`)
            return null
        }

        return referrer.user
    }

    rewardDueToBuyIdo = async ({orderId, stableAmount, note}) => {
        const publicTokenRate = await Utils.Token.getPublicTokenRate()
        const rewardPublicAmount = (stableAmount / publicTokenRate).toFixed(5)
        const referrerId = await this._getReferrerId(userId)

        return await this.reward({
            userId: referrerId,
            amount: rewardPublicAmount,
            note,
            callback: async (opts) => {
                const updated = await this.model.Order.findOneAndUpdate(
                    {
                        _id: orderId,
                        status: CONSTANTS.Market.ORDER_STATUS.FULFILLED,
                    },
                    {
                        status: CONSTANTS.Market.ORDER_STATUS.FULFILLED_REFERRAL,
                    },
                    opts,
                )

                if (!updated) throw RestError.NewNotAcceptableError('REFERRAL_REWARD_ALREADY')
            },
        })
    }

    rewardDueToRegistration = async ({userId, note}) => {
        const referrerId = await this._getReferrerId(userId)
        if(!referrerId) {
            console.log(`[Referral] no referrer found for user ${userId}`)
            return await this.model.Referral.getModel().findOneAndUpdate(
                {user: userId},
                {register_reward: -1})
        }

        // reward to referrer
        const rewardSetting = await this.model.SystemSetting.getModel().findOne({key: 'REFERRAL_REWARD'})
        if (rewardSetting && rewardSetting.value && rewardSetting.value.registration > 0) {
            console.log(`[Referral] reward due to registration for ${referrerId}`)
            const referral = await this.model.Referral.getModel().findOne({user: userId}).lean()
            if(referral && referral.register_reward != 0) {
                throw RestError.NewNotAcceptableError(`Reward for user registration ${userId} was already taken`)
            }
            
            let session = await mongoose.startSession()
            try {
                session.startTransaction({
                    readConcern: {level: 'majority'},
                    writeConcern: {w: 'majority'},
                })
    
                console.log(`[Referral] Mark referral from user ${userId} rewared = ${rewardSetting.value.registration}`)
                await this.model.Referral.getModel().findOneAndUpdate(
                    {user: userId},
                    {register_reward: Number(rewardSetting.value.registration)},
                    {session})
    

                const referrerReward = await this.reward({
                    userId: referrerId,
                    amount: Number(rewardSetting.value.registration),
                    note,
                    session
                })
                const referralReward = await this.reward({
                    userId: userId,
                    amount: Number(rewardSetting.value.registration),
                    note: `[referral]: ${note}`,
                    session
                })
                await session.commitTransaction()

                return {
                    referrerReward,
                    referralReward
                }
            } catch(error) {
                console.log(error)
                await session.abortTransaction()
            } finally {
                session.endSession()
            }
        } else {
            console.log(`[Referral] Reward for registration setting not found`, rewardSetting)
        }

        return null
    }
}

module.exports = ReferralAction
