const Utils = require('../../utils')
const CONSTANTS = require('../../constants')
const Wallet = require('./_wallet')
const {encrypt} = require('../../utils/encrypt.util')
const BscService = require('../../services/web3/bsc/bsc')
const Queue = require('../../services/queue')
const QRCode = require('qrcode')
const {RestError, GenCode, Tfa} = require('../../utils')
const { getEnv } = require('../../utils/getEnv.util')
const USDT_BSC_CONTRACT = getEnv('USDT_TOKEN')
class UsdtWallet extends Wallet {
    constructor(opts) {
        super(opts, 'usdt')
    }

    withdraw = async ({userId, toAddr, amount}) => {
        amount = Number(amount)
        if (amount <= 0) throw RestError.NewBadRequestError('WITHDRAWAL_INVALID')

        const balance = await this.get(userId)
        if (!balance || !balance.usdt || balance.usdt.balance < amount)
            throw RestError.NewBadRequestError('WITHDRAWAL_NOT_ENOUGH_MONEY')

        let withdrawal = await this.model.Transaction.findOne({
            user: userId,
            status: CONSTANTS.EntityConst.TRANSACTION.STATUS.PENDING,
            type: CONSTANTS.EntityConst.TRANSACTION.TYPE.WITHDRAW,
        })
        if (withdrawal) {
            throw RestError.NewBadRequestError('WITHDRAWAL_LIMIT')
        }
        const no = GenCode.genCode(7)

        let verifyCode = GenCode.genSimpleCode(6)
        const isTfaEnabled = await Tfa.isEnabled(this.model.Tfa)(userId)
        if(isTfaEnabled) {
            verifyCode = '2fa'
        }

        withdrawal = await this.model.Transaction.createOne({
            user: userId,
            no,
            tx_id: 'n/a',
            gateway: CONSTANTS.EntityConst.TRANSACTION.GATEWAY.BSC,
            type: CONSTANTS.EntityConst.TRANSACTION.TYPE.WITHDRAW,
            from: '',
            to: toAddr,
            amount,
            verification_code: verifyCode,
            currency: {
                symbol: CONSTANTS.EntityConst.TRANSACTION.CURRENCY.USDT,
                token_address: USDT_BSC_CONTRACT
            },
            rate_price: 1,
            is_collected: false,
            status: CONSTANTS.EntityConst.TRANSACTION.STATUS.WAITING,
        })

        if (!withdrawal) throw RestError.NewBadRequestError('WITHDRAWAL_FAILED')

        const object = withdrawal.toObject()
        return object
    }

    verifyWithdraw = async ({userId, no, code}) => {
        let transaction = await this.model.Transaction.getModel().findOne(
            {
                user: userId,
                no,
                status: CONSTANTS.EntityConst.TRANSACTION.STATUS.WAITING,
            }
        ).sort({ createdAt: -1 })
        if (!transaction) throw RestError.NewNotFoundError('WITHDRAWAL_VERIFY_FAILED')
        if(Date.now() - new Date(transaction.createdAt).getTime() > CONSTANTS.UtilsConst.DIFF_TIME.THREE_MINUTE) {
            throw RestError.NewNotAcceptableError('Withdrawal has been expired.')
        }

        if(transaction.verification_code === '2fa') {
            await Tfa.verify2FA(this.model.Tfa)({userId, code})
        } else if(transaction.verification_code != code) {
            throw RestError.NewNotAcceptableError(`INCORRECT_VERIFICATION_CODE`)
        }

        transaction.status = CONSTANTS.EntityConst.TRANSACTION.STATUS.PENDING
        transaction = await transaction.save({new:true})

        await Queue.add(CONSTANTS.JobConst.QUEUE_NAME.BSC_WITHDRAW_QUEUE, {transactionId: transaction._id})
        return transaction.toObject()
    }

    getWithdraw = async ({userId, limit, page, status}) => {
        const skip = limit * (page - 1)
        const query = {
            type: CONSTANTS.EntityConst.TRANSACTION.TYPE.WITHDRAW,
            status: {
                $ne: CONSTANTS.EntityConst.TRANSACTION.STATUS.WAITING
            }
        }

        if(userId && userId != 'all') query.user = userId

        if (status && status.length > 0) query.status = {$in: status}
        let withdraw = await this.model.Transaction.getModel()
            .find(query)
            .sort({_id: -1})
            .limit(limit)
            .skip(skip)
            .lean()

        return withdraw
    }

    getDeposit = async ({userId, limit, page, status}) => {
        // TODO: add redis locker to avoid race condition
        const skip = limit * (page - 1)
        const query = {
            user: userId,
            type: CONSTANTS.EntityConst.TRANSACTION.TYPE.DEPOSIT,
        }

        if (status && status.length > 0) query.status = {$in: status}
        let deposit = await this.model.Transaction.getModel().find(query).sort({_id: -1}).limit(limit).skip(skip).lean()

        return deposit
    }

    deposit = async ({userId}) => {
        let data = await this.model.BcWallet.findOne({user: userId})
        if (!data) {
            const newWallet = BscService.generateAccount(process.env[`${process.env.MODE}_USER_NMEMONIC_ENABLE`])
            data = await this.model.BcWallet.createOne({
                user: userId,
                address: newWallet.address,
                private_key: encrypt(newWallet.privateKey),
                mnemonic: newWallet.mnemonic,
                default: true,
            })
        }

        if (!data) {
            throw RestError.NewBadRequestError('GENERATE_BSC_WALLET_FAILED')
        }

        data = data.toObject()
        delete data.mnemonic
        delete data.private_key
        data.stringQR = await QRCode.toDataURL(data.address)
        return data
    }
}

module.exports = UsdtWallet
