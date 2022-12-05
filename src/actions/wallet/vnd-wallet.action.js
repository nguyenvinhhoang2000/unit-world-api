const Utils = require('../../utils')
const {EntityConst, Lang, UtilsConst} = require('../../constants')
const Wallet = require('./_wallet')
const {RestError, GenCode, Tfa} = require('../../utils')
const { round } = require('lodash')

class VndWallet extends Wallet {
    constructor(opts) {
        super(opts, 'fiat')
    }

    withdraw = async ({userId, bankAccountId, amount}) => {
        const balance = await this.get(userId)

        if (amount > balance.fiat.balance) {
            throw RestError.NewNotAcceptableError('NOT_ENOUGH_MONEY')
        }

        let newWithdraw = null
        try {
            let bankAccount = await this.model.BankAccount.findOne({_id: bankAccountId, inactive: { $ne: true }})
            if (!bankAccount) {
                throw RestError.NewNotAcceptableError(`USER_BANK_NOTFOUND`)
            }

            const no = GenCode.genCode(7)

            let verifyCode = GenCode.genSimpleCode(6)
            const isTfaEnabled = await Tfa.isEnabled(this.model.Tfa)(userId)
            if(isTfaEnabled) {
                verifyCode = '2fa'
            }
            const request = {
                no,
                quantity: amount,
                currency: EntityConst.BANK_WITHDRAW.CURRENCY.VND,
                status: EntityConst.BANK_WITHDRAW.STATUS.WAITING,
                from: null,
                to: bankAccount._id,
                owner: userId,
                verification_code: verifyCode,
                created_at_time: Date.now(),
                confirmation: {
                    is_confirmed: false,
                    verification_screenshot: '', //"image or tx code"
                },
            }

            newWithdraw = await this.model.BankWithdraw.createOne(request)
            // const withdrawTransaction = async(params, {session}) => {
            //     await this.lock(userId, amount, session)
            //     return await this.model.BankWithdraw.createOne(request, {session})
            //
            // }
            // newWithdraw = await Utils.Mongo.performTransaction(withdrawTransaction, {})
        } catch (error) {
            // if (!newWithdraw) {
            //     await this.unlock(userId, amount)
            // }
            console.log(error)
            throw error
        }

        return newWithdraw && newWithdraw.toObject() // trả về no để user keep track status
    }

    getWithdraw = async ({userId, limit, page, status, id}) => {
        const skip = limit * (page - 1)
        const query = {
            status: {
                $ne: EntityConst.BANK_WITHDRAW.STATUS.WAITING
            }
        }

        console.log({userId})
        if (userId && userId != 'all') {
            query.owner = userId
        }
        if(id) { // if admin and id> get detail
            const result = await this.model.BankWithdraw.getModel().findOne({_id:id})
            .populate('owner', 'role _id email username name country status createdAt avatar add_info gender phone')
            .populate('to').lean()
            if(result.confirmation && result.confirmation.verification_screenshot 
                && result.confirmation.verification_screenshot.startsWith('[')) {
                result.confirmation.verification_screenshot = JSON.parse(result.confirmation.verification_screenshot)
            }
            return result
        }

        if (status && status.length > 0) query.status = {$in: status}
        // console.log({query})

        let withdraw = await this.model.BankWithdraw.getModel()
            .find(query)
            .populate('owner', 'role _id email username name country status createdAt avatar add_info gender phone')
            .sort({_id: -1})
            .limit(limit)
            .skip(skip)
            .lean()

        withdraw = withdraw.map((w) => {
            if(w.confirmation && w.confirmation.verification_screenshot 
                && w.confirmation.verification_screenshot.startsWith('[')) {
                w.confirmation.verification_screenshot = JSON.parse(w.confirmation.verification_screenshot)
            }
            delete w.verification_code
            return w
        })
        return withdraw
    }

    verifyWithdraw = async ({userId, no, code}) => {
        const withdraw = await this.model.BankWithdraw.getModel().findOne({
            owner: userId,
            no
        }).sort({ createdAt: -1 })
        if (!withdraw) {
            throw RestError.NewNotFoundError(`WITHDRAWAL no ${no} not found`)
        }

        if(new Date(withdraw.createdAt).getTime() < Date.now() - UtilsConst.DIFF_TIME.THREE_MINUTE) {
            throw RestError.NewNotAcceptableError(`Withdrawal has been expired!`)
        }

        if(withdraw.status != EntityConst.BANK_WITHDRAW.STATUS.WAITING) {
            throw RestError.NewNotAcceptableError(`Withdrawal might be cancelled status = ${withdraw.status}`)
        }

        if(withdraw.verification_code === '2fa') {
            await Tfa.verify2FA(this.model.Tfa)({userId, code})
        } else if(withdraw.verification_code != code) {
            throw RestError.NewNotAcceptableError(`INCORRECT_VERIFICATION_CODE`)
        }

        withdraw.status = EntityConst.BANK_WITHDRAW.STATUS.PROCESSING
        await this.add(userId, -withdraw.quantity, async (opts) => {
            await withdraw.save()
        })
        
        return withdraw
    }

    cancelWithdraw = async ({userId, no}) => {
        const withdraw = await this.model.BankWithdraw.findOne({
            owner: userId,
            no,
            status: {
                $in: [EntityConst.BANK_WITHDRAW.STATUS.WAITING],
            },
        })

        if (withdraw) {
            await this.add(userId, withdraw.quantity, async (opts) => {
                await this.model.BankWithdraw.findOneAndUpdate({
                        _id: withdraw._id,
                    },
                    {
                        status: EntityConst.BANK_WITHDRAW.STATUS.CANCELED,
                    },
                    opts,
                )
            })
        }

        return withdraw
    }

    cancelDeposit = async ({userId, no}) => {
        const deposit = await this.model.BankDeposit.findOne({
            owner: userId,
            no,
            status: {
                $in: [EntityConst.BANK_DEPOSIT.STATUS.WAITING_USER_TRANSFER],
            },
        })

        if (deposit) {
            await this.model.BankDeposit.findOneAndUpdate({
                    _id: deposit._id,
                    status: EntityConst.BANK_DEPOSIT.STATUS.WAITING_USER_TRANSFER
                },
                {
                    status: EntityConst.BANK_DEPOSIT.STATUS.CANCELED,
                }
            )
        }

        return deposit
    }

    adminMarkWithdraw = async ({no, status, evidence, note}) => {
        return Utils.Mongo.performTransaction(this._adminMarkWithdraw, {no, status, evidence, note})
    }

    _adminMarkWithdraw = async ({no, status, evidence, note}, {session}) => {
        const withdraw = await this.model.BankWithdraw.findOneAndUpdate(
            {
                no,
                status: EntityConst.BANK_WITHDRAW.STATUS.PROCESSING,
            },
            {
                status,
                confirmation: {
                    is_confirmed: true,
                    verification_screenshot: evidence instanceof Object? JSON.stringify(evidence): evidence,
                    note,
                },
            },
            {session, new: true},
        )

        console.log({withdraw, status})
        if (!withdraw) {
            throw RestError.NewNotAcceptableError(`WITHDRAWAL_MISMATCH`)
        }

        if (status == EntityConst.BANK_WITHDRAW.STATUS.SUCCEEDED) {
            // nothing
        } else if (
            status == EntityConst.BANK_WITHDRAW.STATUS.CANCELED ||
            status == EntityConst.BANK_WITHDRAW.STATUS.FAILED
        ) {
            await this.add(withdraw.owner, withdraw.quantity)
        } else {
            throw RestError.NewNotAcceptableError(`WITHDRAWAL_NOT_ALLOW`)
        }

        // TODO: send email/sms notify to user if needed

        return withdraw
    }

    deposit = async ({userId, amount}) => {
        if (amount <= 0) throw RestError.NewNotAcceptableError('DEPOSIT_MINIMUM_REQUIRED')
        let deposit = await this.model.BankDeposit.findOne({
            owner: userId,
            status: EntityConst.BANK_DEPOSIT.STATUS.WAITING_USER_TRANSFER,
        })

        if (deposit) {
            deposit.status = EntityConst.BANK_DEPOSIT.STATUS.CANCELED
            await deposit.save()
        }

        const admin = await this.model.User.findOne({role: EntityConst.USER.ROLES.ADMIN})
        if (!admin) throw RestError.NewNotFoundError('ADMIN_NOTFOUND')

        let bankAccount = await this.model.BankAccount.findOne({user: admin._id, inactive: { $ne: true }})
        if (!bankAccount) {
            throw RestError.NewNotAcceptableError(`ADMIN_BANK_NOTFOUND`)
        }

        const no = GenCode.genCode(7)
        const data = {
            no,
            quantity: amount,
            currency: EntityConst.BANK_DEPOSIT.CURRENCY.VND,
            status: EntityConst.BANK_DEPOSIT.STATUS.WAITING_USER_TRANSFER,
            from: null,
            to: bankAccount._id,
            owner: userId,
            created_at_time: Date.now(),
            confirmation: {
                is_confirmed: false,
                verification_screenshot: '', //"image or tx code"
            },
        }

        const request = await this.model.BankDeposit.createOne(data)
        return {
            account: bankAccount,
            request,
            no,
        }
    }

    // pending > waiting (user has sent money and mark done)
    markDeposit = async ({userId, no, status, evidence}) => {
        if (
            ![EntityConst.BANK_DEPOSIT.STATUS.WAITING_SYSTEM_VERIFY, EntityConst.BANK_DEPOSIT.STATUS.CANCELED].includes(
                status,
            )
        ) {
            throw RestError.NewBadRequestError('DEPOSIT_BAD_REQUEST')
        }
        const result = await this.model.BankDeposit.findOneAndUpdate(
            {
                owner: userId,
                no,
                status: EntityConst.BANK_DEPOSIT.STATUS.WAITING_USER_TRANSFER,
            },
            {
                status: EntityConst.BANK_DEPOSIT.STATUS.WAITING_SYSTEM_VERIFY,
                confirmation: {
                    is_confirmed: false,
                    verification_screenshot: evidence,
                },
            },
        )

        if (!result) throw RestError.NewNotFoundError('DEPOSIT_NOTFOUND')
        // TODO: send email notify to admin

        return result
    }

    adminMarkDeposit = async ({no, status, evidence, note}) => {
        if (![EntityConst.BANK_WITHDRAW.STATUS.SUCCEEDED, EntityConst.BANK_DEPOSIT.STATUS.FAILED].includes(status)) {
            throw new Error('DEPOSIT_BAD_REQUEST')
        }

        const result = await this.model.BankDeposit.findOne({
            no: no,
            status: EntityConst.BANK_DEPOSIT.STATUS.WAITING_SYSTEM_VERIFY,
        })

        if (!result) throw RestError.NewNotFoundError('DEPOSIT_REQUEST_NOTFOUND')

        if (status !== EntityConst.BANK_WITHDRAW.STATUS.SUCCEEDED) {
            return await this.model.BankDeposit.findOneAndUpdate(
                {
                    no: no,
                    status: EntityConst.BANK_DEPOSIT.STATUS.WAITING_SYSTEM_VERIFY,
                },
                {
                    status: status,
                    'confirmation.is_confirmed': false,
                    'confirmation.note': note,
                },
            )
        }

        return await this.add(result.owner, round(result.quantity), async (opts) => {
            return await this.model.BankDeposit.findOneAndUpdate(
                {
                    no: no,
                    status: EntityConst.BANK_DEPOSIT.STATUS.WAITING_SYSTEM_VERIFY,
                },
                {
                    status: EntityConst.BANK_WITHDRAW.STATUS.SUCCEEDED,
                    'confirmation.is_confirmed': true,
                    'confirmation.note': note,
                },
                opts,
            )
        })

        // TODO: send email notify to user
    }

    getDeposit = async ({userId, limit, page, status, id}) => {
        const skip = limit * (page - 1)
        const query = {}

        if (userId && userId != 'all') {
            query.owner = userId
        }
        if(id) { // if admin and id> get detail
            return await this.model.BankDeposit.getModel().findOne({_id:id})
            .populate('owner', 'role _id email username name country status createdAt avatar add_info gender phone')
            .populate('to').lean()
        }
        if (status && status.length > 0) query.status = {$in: status}
        console.log({query})
        let deposit = await this.model.BankDeposit.getModel().find(query)
            .populate('owner', 'role _id email username name country status createdAt avatar add_info gender phone')
            .populate('to')
            .sort({_id: -1}).limit(limit).skip(skip).lean()

        return deposit
    }

    addBankAccount = async ({userId, bank_type, number_card, full_name, bank_branch}) => {
        console.log(`[VndWallet]`, {userId, bank_type, number_card, full_name, bank_branch})
        const bankAcc = await this.model.BankAccount.findOneAndUpdate(
            {
                user: userId,
                bank_type,
            },
            {
                user: userId,
                bank_type,
                number_card,
                full_name,
                bank_branch,
                inactive: false
            },
            {
                new: true,
                upsert: true,
            },
        )

        return bankAcc
    }

    removeBankAccount = async ({userId, bankAccountId}) => {
        console.log(`[VndWallet] remove bank id ${bankAccountId}`)
        const bankAcc = await this.model.BankAccount.getModel().findOneAndUpdate({
            _id: bankAccountId,
            user: userId,
        }, {
            inactive: true
        })

        return bankAcc
    }

    getBankAccount = async ({userId}) => {
        const bankAcc = await this.model.BankAccount.findMany({user: userId, inactive: { $ne: true }})

        return bankAcc
    }
}

module.exports = VndWallet
