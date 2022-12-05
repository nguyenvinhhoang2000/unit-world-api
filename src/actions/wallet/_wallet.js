const Utils = require('../../utils')
const {RestError} = Utils
const CONSTANTS = require('../../constants')
const {performTransaction} = require('../../utils/mongo.util')
const { locker } = require('../../services/locker')
class Wallet {
    constructor(opts, type) {
        this.model = opts.model
        this.type = type
    }

    _init = async (userId) => {
        const data = {
            user: userId,
            usdt: {
                available_balance: 0,
                balance: 0,
            },
            fiat: {
                available_balance: 0,
                balance: 0,
            },
            token: {
                available_balance: 0,
                balance: 0,
                available_commission: 0,
                commission: 0,
            },
            public_token: {
                available_balance: 0,
                balance: 0,
                available_commission: 0,
                commission: 0,
            },
        }
        return await this.model.Wallet.createOne(data)
    }

    get = async (userId) => {
        let wallet = await this.model.Wallet.findOne({user: userId})
        if (!wallet) {
            wallet = await this._init(userId)
            //throw new Error(`[UsdrWallet] wallet not found for user ${userId}`)
        }
        const tokens = await this.model.Wallet.getModel().findOne({user: userId}).lean()

        return {...tokens}
    }

    add = async (userId, amount, callback = null, session = null) => {
        const _add = async ({userId, amount}, opts = {}) => {
            let wallet = await this.model.Wallet.findOne({user: userId})
            if (!wallet) {
                wallet = await this._init(userId)
                //throw new Error(`[Wallet] wallet not found for user ${userId}`)
            }

            console.log(`[Wallet][${this.type}] Credit token ${this.type}.balance = ${amount}`)
            let updated = await this.model.Wallet.findOneAndUpdate(
                {user: userId},
                {
                    $inc: {[`${this.type}.balance`]: amount},
                },
                opts,
            )

            if (!updated) throw RestError.NewInternalServerError('BALANCE_UPDATE_FAIL')
            if (updated[this.type].balance < 0) throw RestError.NewNotAcceptableError('NOT_ENOUGH_MONEY')
            if (callback) updated = await callback(opts, updated)

            return updated
        }


        const lockerKey = `wallet:${userId}`
        const lockerTTL = 30000 // 30 seconds
        let lock = await locker.lock(lockerKey, lockerTTL)
        try {
            return await performTransaction(_add, {userId, amount}, session)
        } catch (err) {
            console.log(err)
            throw err
        } finally {
            lock && lock.unlock().catch(e => {
                console.error(`[Wallet] unlock lock err: ${e.message}`)
            })
        }
    }

    withdraw = async (params) => {}

    deposit = async (params) => {}
}

module.exports = Wallet
