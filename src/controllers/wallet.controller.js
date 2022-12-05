const CONSTANTS = require('../constants')
const { RestError, ResponseFormat } = require('../utils')
const Utils = require('../utils')
const S3 = require('../utils/s3.util')
const {Tfa} = require('../utils')
const { getPagination } = require('../utils/common.util')

class Wallet {
    constructor(opts) {
        this.model = opts.model
        this.action = opts.action
    }

    get = async ({ user }) => {
        let data = await this.action.Wallet.usdrw.get(user._id)

        return ResponseFormat.formatResponseObj({ data })
    }
    getStock = async ({ user, page = 1, limit = 20, sort, query, search_key }) => {
        let data = await this.action.Wallet.stockw.getStock({
            userId: user._id,
            query,
            sort,
            search_key,
            page,
            limit
        })

        return ResponseFormat.formatResponseObj({ data })
    }

    withdraw = async ({ user, amount, currency, bankAccountId, toAddr }) => {
        try {
            let data = null
            if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.VND) {
                data = await this.action.Wallet.vndw.withdraw({ userId: user._id, bankAccountId, amount })
            } else if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.USDT) {
                data = await this.action.Wallet.usdtw.withdraw({ userId: user._id, amount, toAddr })
            } else {
                throw RestError.NewBadRequestError(`CURRENCY_NOT_SUPPORT`)
            }

            console.log({ data })
            const numberVerify = data && data.verification_code
            if (!numberVerify) throw RestError.NewBadRequestError(`WITHDRAWAL_REQUEST_FAIL`)

            //send email if TFA not enabled
            if (data.verification_code !== '2fa') {
                console.log(`[Wallet] Send withdrawal verification code to ${user.email}`)
                Utils.Email.sendEmail(user.email, numberVerify)
                data.verification_code = 'email'
            }

            return ResponseFormat.formatResponseObj({ data })
        } catch (error) {
            throw error
        }
    }

    
    getDepositWithdrawSwap = async ({user, limit, page, filter, sort}) => {
        const pagination = getPagination(page, limit)
        sort = Object.assign({ "updatedAt": -1 }, sort)

        const markets = await this.model.Market.getModel().find({market: CONSTANTS.Market.MARKET.SWAP})
        if(!markets || markets.length === 0) {
            throw RestError.NewInternalServerError(`SWAP market not available`)
        }
        const marketIds = markets.map(m => m._id)

        if(filter && (filter.createdAt || filter.updatedAt)){
            for(const operator of ["$gt", "$lt", "$gte", "$lte"]) {
                if(filter.createdAt &&  filter.createdAt[operator]) {
                    filter.createdAt[operator] = new Date(filter.createdAt[operator])
                }
                if(filter.updatedAt &&  filter.updatedAt[operator]) {
                    filter.updatedAt[operator] = new Date(filter.updatedAt[operator])
                }
            }
        } else if(filter && filter["$and"]) {
            for(const time of filter["$and"]) {
                for(const operator of ["$gt", "$lt", "$gte", "$lte"]) {
                    if(time.createdAt && time.createdAt[operator]) {
                        time.createdAt[operator] = new Date(time.createdAt[operator])
                    }
                    if(time.updatedAt && time.updatedAt[operator]) {
                        time.updatedAt[operator] = new Date(time.updatedAt[operator])
                    }
                }
            }
        }

        let transactions = await this.model.Transaction.getModel().aggregate([{
                $match: { 
                    user: user._id
                }
            }, {
                $addFields: {
                    owner: "$user",
                    asset: "$currency.symbol",
                    no: "$tx_id",
                    quantity: "$amount"
                }
            },
            {
                $unionWith: {
                    coll: "bankdeposits",
                    pipeline: [ { 
                            $match: {
                                owner: user._id
                            }
                        }, {
                            $addFields: {
                                asset: CONSTANTS.EntityConst.BANK_DEPOSIT.CURRENCY.VND,
                                type: CONSTANTS.EntityConst.TRANSACTION.TYPE.DEPOSIT,
                            }
                        }
                    ]
                },
            },
            {
                $unionWith: {
                    coll: "bankwithdraws",
                    pipeline: [ { 
                            $match: {
                                owner: user._id
                            }
                        }, {
                            $addFields: {
                                asset: CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.VND,
                                type: CONSTANTS.EntityConst.TRANSACTION.TYPE.WITHDRAW,
                            }
                        }
                    ]
                },
            },
            {
                $unionWith: {
                    coll: "orders",
                    pipeline: [ { 
                            $match: {
                                owner: user._id,
                                market: {
                                    $in: marketIds
                                }
                            }
                        }, {
                            $addFields: {
                                asset: "$symbol",
                                direction: "$type",
                                type: CONSTANTS.EntityConst.TRANSACTION.TYPE.SWAP,
                                no: "$order_no"
                            }
                        }
                    ]
                },
            },
            {
                $project: {
                    status: 1,
                    asset: 1,
                    type: 1,
                    no: 1,
                    quantity: 1,
                    owner: 1,
                    fee: 1,
                    updatedAt: 1,
                    createdAt: 1
                }
            },
            {
                $match: filter
            },
            { $sort: sort },
            { $skip: pagination.skip },
            { $limit: pagination.limit }
        ])

        const total = await this.model.Transaction.getModel().aggregate([{
                $match: { 
                    user: user._id
                }
            }, {
                $addFields: {
                    owner: "$user",
                    asset: "$currency.symbol",
                    no: "$tx_id",
                    quantity: "$amount"
                }
            },
            {
                $unionWith: {
                    coll: "bankdeposits",
                    pipeline: [ { 
                            $match: {
                                owner: user._id
                            }
                        }, {
                            $addFields: {
                                asset: CONSTANTS.EntityConst.BANK_DEPOSIT.CURRENCY.VND,
                                type: CONSTANTS.EntityConst.TRANSACTION.TYPE.DEPOSIT,
                            }
                        }
                    ]
                },
            },
            {
                $unionWith: {
                    coll: "bankwithdraws",
                    pipeline: [ { 
                            $match: {
                                owner: user._id
                            }
                        }, {
                            $addFields: {
                                asset: CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.VND,
                                type: CONSTANTS.EntityConst.TRANSACTION.TYPE.WITHDRAW,
                            }
                        }
                    ]
                },
            },
            {
                $unionWith: {
                    coll: "orders",
                    pipeline: [ { 
                            $match: {
                                owner: user._id,
                                market: {
                                    $in: marketIds
                                }
                            }
                        }, {
                            $addFields: {
                                asset: "$symbol",
                                direction: "$type",
                                type: CONSTANTS.EntityConst.TRANSACTION.TYPE.SWAP,
                                no: "$order_no"
                            }
                        }
                    ]
                },
            },
            {
                $project: {
                    status: 1,
                    asset: 1,
                    type: 1,
                    no: 1,
                    quantity: 1,
                    owner: 1,
                    fee: 1,
                    updatedAt: 1,
                    createdAt: 1
                }
            },
            {
                $match: filter
            },
            {
                $match: filter
            },
            { $count: "total" }
        ])

        transactions = transactions.map(tx => {
            if(tx.status === "S" || tx.status === "FF") tx.status = "C"
            if(tx.asset && tx.asset.includes('/')) {
                const splitedAsset = tx.asset.split('/')

                if(tx.direction == CONSTANTS.Market.ORDER.BUY) {
                    tx.asset = splitedAsset[1]
                    tx.targetAsset = splitedAsset[0]
                } else {
                    tx.asset = splitedAsset[0]
                    tx.targetAsset = splitedAsset[1]
                }
            } else {
                if(!tx.asset) {
                    tx.asset = CONSTANTS.TokenConst.TOKEN.USDT
                }
                tx.targetAsset = "-"
            }

            if(!tx.fee) tx.fee = 0

            return tx
        })

        return ResponseFormat.formatResponseObj({data: {
                total: total && total.length > 0 ? total[0].total:0,
                transactions
            }
        })
    }

    getWithdraw = async ({ user, limit, page, status, currency, userId, id }) => {
        try {
            let data = null
            limit = parseInt(limit)
            page = parseInt(page)
            status = status ? status.split(',') : []

            if (![CONSTANTS.EntityConst.USER.ROLES.ADMIN, CONSTANTS.EntityConst.USER.ROLES.ADMIN].includes(user.role)) {
                userId = null
                id = null
            }

            if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.VND) {
                data = await this.action.Wallet.vndw.getWithdraw({ userId: userId || user._id, limit, page, id, status })
            } else if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.USDT) {
                data = await this.action.Wallet.usdtw.getWithdraw({ userId: userId || user._id, limit, page, status })
            } else {
                throw RestError.NewBadRequestError(`CURRENCY_NOT_SUPPORT`)
            }

            return ResponseFormat.formatResponseObj({ data })
        } catch (error) {
            throw error
        }
    }

    verifyWithdraw = async ({ user, no, code, currency }) => {
        try {
            let data = null
            if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.VND) {
                data = await this.action.Wallet.vndw.verifyWithdraw({ userId: user._id, no, code })
            } else if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.USDT) {
                data = await this.action.Wallet.usdtw.verifyWithdraw({ userId: user._id, no, code })
            } else {
                throw RestError.NewBadRequestError(`CURRENCY_NOT_SUPPORT`)
            }

            return ResponseFormat.formatResponseObj({ data })
        } catch (error) {
            throw error
        }
    }

    cancelWithdraw = async ({ user, no, currency }) => {
        try {
            let data = null
            if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.VND) {
                data = await this.action.Wallet.vndw.cancelWithdraw({ userId: user._id, no })
            } else {
                throw RestError.NewBadRequestError(`CURRENCY_NOT_SUPPORT`)
            }

            return ResponseFormat.formatResponseObj({ data })
        } catch (error) {
            throw error
        }
    }

    adminMarkWithdrawUpload = async ({ file, no, position }) => {
        try {
            const { Location: location } = await S3.uploadImagePublic(file, `withdrawal-no-${no}-${position}`, 'withdrawal', 'admin')

            return ResponseFormat.formatResponseObj({
                data: {
                    location
                }
            })
        } catch (error) {
            throw error
        }
    }

    adminMarkWithdraw = async ({ no, status, evidence, note, currency }) => {
        try {
            let data = null
            if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.VND) {
                data = await this.action.Wallet.vndw.adminMarkWithdraw({ no, status, evidence, note })

                // TODO: send notification email to user
            } else {
                throw RestError.NewBadRequestError(`CURRENCY_NOT_SUPPORT`)
            }

            return ResponseFormat.formatResponseObj({ data })
        } catch (error) {
            throw error
        }
    }

    addBankAccount = async ({ user, bank_type, number_card, full_name, bank_branch }) => {
        try {
            const bankAcc = await this.action.Wallet.vndw.addBankAccount({
                userId: user._id,
                bank_type,
                number_card,
                full_name,
                bank_branch,
            })
            return ResponseFormat.formatResponseObj({ data: bankAcc })
        } catch (error) {
            throw error
        }
    }

    removeBankAccount = async ({ user, bank_account_id }) => {
        try {
            const bankAcc = await this.action.Wallet.vndw.removeBankAccount({
                userId: user._id,
                bankAccountId: bank_account_id,
            })
            return ResponseFormat.formatResponseObj({ data: bankAcc })
        } catch (error) {
            throw error
        }
    }

    getBankAccount = async ({ user }) => {
        try {
            const bankAcc = await this.action.Wallet.vndw.getBankAccount({ userId: user._id })
            return ResponseFormat.formatResponseObj({ data: bankAcc })
        } catch (error) {
            throw error
        }
    }

    requestDeposit = async ({ user, currency, amount }) => {
        try {
            let data = null

            if (currency == CONSTANTS.EntityConst.BANK_DEPOSIT.CURRENCY.VND) {
                data = await this.action.Wallet.vndw.deposit({userId: user._id, amount})
            } else if (currency == CONSTANTS.EntityConst.BANK_DEPOSIT.CURRENCY.USDT) {
                data = await this.action.Wallet.usdtw.deposit({userId: user._id})
            } else {
                throw RestError.NewBadRequestError(`CURRENCY_NOT_SUPPORT`)
            }
            
            return ResponseFormat.formatResponseObj({data})    
        } catch (error) {
            throw error
        }
    }

    getDeposit = async ({ user, limit, page, status, currency, userId, id }) => {
        let data = null
        limit = parseInt(limit)
        page = parseInt(page)
        status = status ? status.split(',') : []

        if (![CONSTANTS.EntityConst.USER.ROLES.ADMIN, CONSTANTS.EntityConst.USER.ROLES.ADMIN].includes(user.role)) {
            userId = null
            id = null
        }

        if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.VND) {
            data = await this.action.Wallet.vndw.getDeposit({ userId: userId || user._id, limit, page, id, status })
        } else if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.USDT) {
            data = await this.action.Wallet.usdtw.getDeposit({ userId: userId || user._id, limit, page, status })
        } else {
            throw RestError.NewBadRequestError(`CURRENCY_NOT_SUPPORT`)
        }

        return ResponseFormat.formatResponseObj({ data })
    }

    markDeposit = async ({ user, no, status, currency, file }) => {
        let data = null

        if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.VND) {
            let evidence = ''
            if (file) {
                const {
                    Location: location,
                    Bucket,
                    Key,
                } = await S3.uploadImagePublic(file, 'bank-receipt-deposit-vnd', 'wallet', user._id)
                evidence = location
            }

            data = await this.action.Wallet.vndw.markDeposit({ userId: user._id, no, status, evidence })
        } else if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.USDT) {
            //
        } else {
            throw RestError.NewBadRequestError(`CURRENCY_NOT_SUPPORT`)
        }

        return ResponseFormat.formatResponseObj({ data })
    }

    cancelDeposit = async ({ user, no, currency }) => {
        try {
            let data = null
            if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.VND) {
                data = await this.action.Wallet.vndw.cancelDeposit({ userId: user._id, no })
            } else {
                throw RestError.NewBadRequestError(`CURRENCY_NOT_SUPPORT`)
            }

            return ResponseFormat.formatResponseObj({ data })
        } catch (error) {
            throw error
        }
    }

    adminMarkDeposit = async ({ no, status, evidence, note, currency }) => {
        let data = null
        if (currency == CONSTANTS.EntityConst.BANK_WITHDRAW.CURRENCY.VND) {
            data = await this.action.Wallet.vndw.adminMarkDeposit({ no, status, evidence, note })

            // TODO: send notification email to user
        } else {
            throw RestError.NewBadRequestError(`CURRENCY_NOT_SUPPORT`)
        }

        return ResponseFormat.formatResponseObj({ data })
    }
}

module.exports = Wallet
