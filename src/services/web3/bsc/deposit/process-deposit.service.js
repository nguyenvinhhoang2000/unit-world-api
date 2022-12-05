require('dotenv').config()
const {Mongo, Email} = require('../../../../utils')
const mongoose = require('mongoose')
const container = require('../../../../configs/dependencies/container')
const model = container.resolve('model')
const action = container.resolve('action')
const {CacheService} = require('../../../cache')
const {TokenConst} = require('../../../../constants')

exports.processDeposit = async (transaction) => {
    let tran = null
    let session = await mongoose.startSession()

    try {
        session.startTransaction()
        let bcWallet = await model.BcWallet.findOne({address: transaction.to})
        let check = await model.Transaction.findOne({tx_id: transaction.txId})
        if (bcWallet && !check) {
            tran = await model.Transaction.create(
                {
                    user: bcWallet.user,
                    tx_id: transaction.txId,
                    gateway: transaction.gateway,
                    type: transaction.type,
                    from: transaction.from,
                    to: transaction.to,
                    amount: Number(transaction.amount),
                    blockNumber: Number(transaction.blockNumber),
                    currency: transaction.currency,
                    rate_price: Number(transaction.ratePrice),
                    is_collected: transaction.isCollected,
                    status: 'C',
                },
                {session},
            )
            console.log({tran})
            tran = tran[0]
            //update wallet
            // const wallet = await model.Wallet.findOneAndUpdate({ user: bcWallet.user }, {
            //     $inc: {
            //         'usdt.available_balance': Number(transaction.amount) * Number(transaction.ratePrice),
            //         'usdt.balance': Number(transaction.amount) * Number(transaction.ratePrice)
            //     }
            // }, { new: true, session })

            const {symbol, token_address} = transaction.currency

            let wallet = null
            if (symbol == TokenConst.TOKEN.USDT) wallet = action.Wallet.usdtw
            else if (symbol == TokenConst.TOKEN.USDR) wallet = action.Wallet.usdrw
            else if (symbol == TokenConst.TOKEN.REX) wallet = action.Wallet.rexw
            else throw new Error('Does not support token', symbol)

            wallet &&
                (await wallet.add(
                    bcWallet.user,
                    Number(transaction.amount) * Number(transaction.ratePrice),
                    null,
                    session,
                ))
            await Mongo.commitWithRetry(session)

            //send the deposit mail successfully
            let account = await model.User.findOne({_id: bcWallet.user})
            Email.sendEmailDeposit(account.email, tran.amount, symbol, tran.tx_id)
        } else {
            console.log(`[${new Date()}] - Deposit - ${transaction.txId} - existed`)
            console.log({bcWallet, check})
        }
    } catch (error) {
        console.error(error)
        await session.abortTransaction()
    } finally {
        session.endSession()
    }
}
