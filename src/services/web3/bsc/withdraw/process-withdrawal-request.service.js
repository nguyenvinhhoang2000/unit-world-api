require('dotenv').config()
//remove dotenv config.config();
const {Sqs, Mongo, Email} = require('../../../../utils')
const {Queue, TokenConst} = require('../../../../constants')
const mongoose = require('mongoose')

const {decrypt} = require('../../../../utils/encrypt.util')
const container = require('../../../../configs/dependencies/container')
const model = container.resolve('model')
const action = container.resolve('action')

const CONSTANTS = require('../../../../constants')
const {getBnbBalance, getBscTokenBalance, createBscTransferToken} = require('../bsc')
const USDT_BSC_CONTRACT = TokenConst.BSC_TOKEN[process.env.MODE].USDT //usdt
const OWNER_ADDRESS = process.env[`${process.env.MODE}_OWNER_ADDRESS`]
const OWNER_PRIVATE_KEY = process.env[`${process.env.MODE}_OWNER_PRIVATE_KEY`]

const _getOwnerBcWallet = async (network = 'BSC') => {
    return {
        address: OWNER_ADDRESS,
        private_key: OWNER_PRIVATE_KEY,
    }
}

const _createTransaction = async (user, transaction, credential) => {
    const total = Number(transaction.amount) + Number(transaction.fee)

    await action.Wallet.usdtw.add(user._id, -total, async (opts, updated) => {
        // TODO: add cronjob to handle exception
        await model.Transaction.findOneAndUpdate(
            {_id: transaction._id},
            {
                status: CONSTANTS.EntityConst.TRANSACTION.STATUS.PROCESSING,
            },
            opts,
        )

    })

    try {
        // transfer usdt
        let transferUsdt = await createBscTransferToken(
            USDT_BSC_CONTRACT,
            transaction.to,
            transaction.amount,
            credential.private_key,
            credential.address,
        )

        if (transferUsdt && transferUsdt.status && transferUsdt.transactionHash) {
            //update transaction
            await model.Transaction.findOneAndUpdate(
                {_id: transaction._id},
                {
                    $set: {
                        tx_id: transferUsdt.transactionHash,
                        status: CONSTANTS.EntityConst.TRANSACTION.STATUS.COMPLETED,
                    },
                },
            )

            Email.sendEmailWithdraw(
                user.email,
                transferUsdt.transactionHash,
                transaction.amount,
                transaction.to,
                transaction.gateway,
                'USDT',
            )
            console.log(
                `[${new Date()}] WITHDRAW COMPLETED - ${transferUsdt.transactionHash} - ${
                    transaction.amount
                } USDT - user: ${transaction.user}`,
            )
        } else {
            await action.Wallet.usdtw.add(user._id, total, async (opts, updated) => {
                await model.Transaction.findOneAndUpdate(
                    {_id: transaction._id},
                    {
                        $set: {
                            status: CONSTANTS.EntityConst.TRANSACTION.STATUS.FAILED,
                        },
                    },
                    opts,
                )
            })
            //Email.sendEmailWithdraw(user.email, null, transaction.amount, transaction.to, transaction.gateway, 'USDT')
            console.log(
                `[${new Date()}] WITHDRAW FAILED - ${transferUsdt.transactionHash} - ${
                    transaction.amount
                } USDT - user: ${transaction.user}`,
            )
        }
    } catch (error) {
        const processing = await model.Transaction.findOneAndUpdate(
            {
                _id: transaction._id,
                status: CONSTANTS.EntityConst.TRANSACTION.STATUS.PROCESSING,
            },
            {
                status: CONSTANTS.EntityConst.TRANSACTION.STATUS.FAILED,
                add_info: error.message,
            },
        )
        if (processing) {
            await action.Wallet.usdtw.add(user._id, total, async (opts, updated) => {
                // await this.model.WalletHistory.getModel().create([{
                //     user: user._id,
                //     currency: CONSTANTS.TokenConst.TOKEN.USDT,
                //     credit: total,
                //     amount: updated.amount,
                //     action: CONSTANTS.EntityConst.WALLET_HISTORY.ACTION.WITHDRAWAL_USDT,
                //     actionId: transaction._id,
                //     note: 'transaction:refunded',
                //     status: CONSTANTS.EntityConst.WALLET_HISTORY.STATUS.COMPLETED,
                // }], opts)
            })
        }
        
        console.log(error)
        throw error
    }
}

module.exports = async ({transactionId}) => {
    try {
        //validate transaction
        let transaction = await model.Transaction.findOne({_id: transactionId})
        if (!transaction || transaction.status != 'P' || transaction.amount <= 0 || transaction.fee < 0) {
            throw new Error(`invalid transaction = ${transactionId}`)
        }
        console.log({transaction})
        const ownerCred = await _getOwnerBcWallet()
        console.log(`[withdraw-service] owner address ${ownerCred.address}`)
        //check bnb balance of owner
        let ownerBnbBalance = await getBnbBalance(ownerCred.address)
        if (ownerBnbBalance < 0.005) {
            throw new Error(`Not enough bnb to create transaction, Bnb = ${ownerBnbBalance}`)
        }

        // check usdt balance of owner
        let ownerUsdtBalance = await getBscTokenBalance(USDT_BSC_CONTRACT, ownerCred.address)
        if (ownerUsdtBalance < transaction.amount) {
            throw new Error(`Not enough ${transaction.amount} USDT to send to user, usdt = ${ownerUsdtBalance}`)
        }

        let user = await model.User.getModel().findOne({_id: transaction.user}).lean()
        if (!user) {
            throw new Error(`Cannot find user`)
        }

        await _createTransaction(user, transaction, ownerCred)
    } catch (error) {
        console.log(error)
        await model.Transaction.findOneAndUpdate(
            {_id: transactionId},
            {
                status: CONSTANTS.EntityConst.WITHDRAW_REQUEST.STATUS.FAILED,
                add_info: error.message,
            },
        )
    }
}
