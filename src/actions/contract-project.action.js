const Utils = require('../utils')
const CONSTANTS = require('../constants')
const {Lang, EntityConst} = CONSTANTS
const {RestError} = require('../utils')
const {ContractProjectLib} = require('../services/project/RexProjectContract.lib')
const Queue = require('../services/queue')
const { SCHEDULE_NAME } = require('../constants/job.constant')
const { round } = require('lodash')

class ContractProjectAction {
    constructor(opts) {
        this.model = opts.model
    }

    addWhiteList = async (addresses) => {
        return await ContractProjectLib.addWhitelist(addresses)
    }

    getVndRate = async() => {
        return 23000
    }
    // precondition: stock and bre were already charged offchain for both taker by maker
    // Send exhange to execute sc, update status to book and orderbook
    exchangeStockUsdr = async (order) => {
        try {
            if (!order || !order.orderbook || order.symbol != CONSTANTS.Market.PAIR.STOCK_USDR) {
                console.error(`Missing order, orderbook or mismatch trading pair`, order)
                throw RestError.NewBadRequestError(`Missing order, orderbook or mismatch trading pair`)
            }
            if (!order.project) {
                console.error(`Missing project in order`, order)
                throw RestError.NewBadRequestError(`Missing project in order`)
            }
            const taker = order.owner._id
            const maker = order.orderbook.owner
            const isTakerBuyer = order.type == CONSTANTS.Market.ORDER.BUY ? true : false

            const takerWallet = await this.model.BcWallet.findOne({user: `${taker}`, inactive: false})
            if (!takerWallet) {
                throw RestError.NewInternalServerError(`takerWallet of ${taker} not found`)
            }

            const makerWallet = await this.model.BcWallet.findOne({user: `${maker}`, inactive: false})
            if (!makerWallet) {
                throw RestError.NewInternalServerError(`makerWallet of ${maker} not found`)
            }

            // const data = {
            //     _symbol: order.project.no,
            //     _seller: isTakerBuyer ? maker : taker,
            //     _stockAmount: order.quantity,
            //     _tokenAmount: order.quanity * order.price,
            //     privateKey: isTakerBuyer ? takerWallet.private_key : makerWallet.private_key,
            //     address: isTakerBuyer ? takerWallet.address : makerWallet.address,
            // }
            // const updateContract = await ContractProjectLib.exchangeStock(data)

            // TODO: wait sc to enable exchange with usdr/rex
            const vndRate = await this.getVndRate()
            const data = {
                _symbol: order.project.no,
                _seller: isTakerBuyer ? makerWallet.address : takerWallet.address,
                _buyer: isTakerBuyer ? takerWallet.address : makerWallet.address,
                _stockAmount: order.quantity,
                _fiatAmount: order.quantity * order.price * vndRate,
                _rateStockFiat: order.price * vndRate,
                fiatType: CONSTANTS.Market.SYMBOL.VND,
            }
            const updateContract = await ContractProjectLib.exchangeP2pStockFiat(data)
            if (!updateContract) throw RestError.NewInternalServerError('Failed to issue new token')

            // TODO update tx confirmation
            await this.model.Order.getModel().findOneAndUpdate(
                {_id: order._id},
                {status: CONSTANTS.Market.ORDER_STATUS.PROCESSING, msg: updateContract.transactionHash},
            )
            console.log(`Exchange stock/bre was sent to sc at ${updateContract.transactionHash}`)
        } catch (error) {
            // mark failed waiting for refund both taker andd maker
            await this.model.Order.getModel().findOneAndUpdate(
                {_id: order._id, status: CONSTANTS.Market.ORDER_STATUS.PENDING},
                {status: CONSTANTS.Market.ORDER_STATUS.FAILED, msg: error.message},
            )
            console.log(error.message)
        }
    }

    _exchangeStockVnd = async(order) => {
        console.log(order)
        let updateContract = null
        if (!order || !order.orderbook || order.symbol != CONSTANTS.Market.PAIR.STOCK_VND) {
            throw RestError.NewBadRequestError(`Missing order, orderbook or mismatch trading pair`, order)
        }
        if (!order.orderbook.project) {
            throw RestError.NewBadRequestError(`Missing project in orderbook`, order)
        }
        if (order.status != CONSTANTS.Market.ORDER_STATUS.PENDING) {
            throw RestError.NewBadRequestError(`Order status should be P..`, order)
        }

        const project = await this.model.Project.getModel().findOne({_id: order.orderbook.project})
        if(!project) {
            throw RestError.NewBadRequestError(`Notfound project in orderbook`, order)
        }
        const taker = order.owner._id
        const maker = order.orderbook.owner
        const isTakerBuyer = order.type == CONSTANTS.Market.ORDER.BUY ? true : false

        const takerWallet = await this.model.BcWallet.findOne({user: `${taker}`, inactive: false})
        if (!takerWallet) {
            throw RestError.NewInternalServerError(`BcWallet of taker:${taker} not found`)
        }

        const makerWallet = await this.model.BcWallet.findOne({user: `${maker}`, inactive: false})
        if (!makerWallet) {
            throw RestError.NewInternalServerError(`BcWallet of maker:${maker} not found`)
        }

        const data = {
            _symbol: project.no,
            _seller: isTakerBuyer ? makerWallet.address : takerWallet.address,
            _buyer: isTakerBuyer ? takerWallet.address : makerWallet.address,
            _stockAmount: order.quantity,
            _fiatAmount: order.quantity * order.price,
            _rateStockFiat: order.price,
            fiatType: CONSTANTS.Market.SYMBOL.VND,
        }
        updateContract = await ContractProjectLib.exchangeP2pStockFiat(data)
        if (!updateContract) throw RestError.NewInternalServerError('Failed to issue new token')

        await this.model.Order.getModel().findOneAndUpdate(
            {_id: order._id},
            {status: CONSTANTS.Market.ORDER_STATUS.PROCESSING, msg: updateContract.transactionHash},
        )
        console.log(`Exchange stock/vnd was sent to sc at ${updateContract.transactionHash}`)


        Utils.Email.sendEmailP2pFinalizeNotice({
            email: order.owner.email,
            orderId: order._id,
            orderNo: order.order_no,
            stock: order.symbol,
            quantity: order.quantity,
            totalPrice: round(order.quantity * order.price, 0),
            unit: CONSTANTS.Market.SYMBOL.VND,
            bank: 'built-in payment'
        }) // notice 

        // // TODO: for testing only
        // await this.model.Order.getModel().findOneAndUpdate({
        //         _id: order._id,
        //         status: CONSTANTS.Market.ORDER_STATUS.PROCESSING
        //     },
        //     {
        //         status: CONSTANTS.Market.ORDER_STATUS.FULFILLED
        //     },
        // )
        // console.log(`Exchange stock/vnd was confirmed successfully`)
        return updateContract
    }
    // precondition: stock and vnd were already charged offchain for both taker by maker
    // Send exhange to execute sc, update status to book and orderbook
    exchangeStockVndBuiltInPayment = async (order) => {
        let updateContract = null
        try {
            updateContract = await this._exchangeStockVnd(order)
        } catch (error) {
            // mark failed waiting for refund both taker andd maker
            if(!updateContract) {
                await this.model.Order.getModel().findOneAndUpdate(
                    {_id: order._id, status: CONSTANTS.Market.ORDER_STATUS.PENDING},
                    {
                        status: CONSTANTS.Market.ORDER_STATUS.FAILED, 
                        msg: error.message
                    },
                )
            } else {
                await this.model.Order.getModel().findOneAndUpdate(
                    {_id: order._id, status: CONSTANTS.Market.ORDER_STATUS.PENDING},
                    {
                        status: CONSTANTS.Market.ORDER_STATUS.DISPUTE, 
                        msg: error.message
                    },
                )
            }
            console.log(error.message)
            throw error
        }
    }

    exchangeStockVndP2pPayment = async (order) => {
        try {
            return await this._exchangeStockVnd(order)
        } catch (error) {
            // mark failed with no refund, wait for dispute
            await this.model.Order.getModel().findOneAndUpdate(
                {_id: order._id, status: CONSTANTS.Market.ORDER_STATUS.PENDING},
                {
                    status: CONSTANTS.Market.ORDER_STATUS.DISPUTE, 
                    msg: error.message
                },
            )

            console.log(error.message)
            throw error
        }
    }

    processVoteAcceptOffer = async(voteId) => {
        const vote = await this.model.Vote.getModel().findOne({_id: voteId}).populate('offer')
        if(!vote) {
            throw new Error(`Vote ${voteId} not found`)
        }

        try {
            const bcWallet = await this.model.BcWallet.findOne({user: vote.voter, inactive: false})
            if (!bcWallet) {
                console.error(`bcWallet of user ${vote.voter} not found`)
                return
            }

            console.log(`[ProjectContract] vote accept offer`)
            console.log({bcWallet})
            const receipt = await ContractProjectLib.voteAcceptOffer(vote.offer.index, Utils.Encrypt.decrypt(bcWallet.private_key), bcWallet.address)
            if(receipt && receipt.transactionHash) {
                console.log(receipt)
                vote.txid = receipt.transactionHash,
                vote.status = CONSTANTS.EntityConst.VOTE.STATUS.COMPLETED // TODO
                await vote.save()
            } else {
                throw new Error(`voteAcceptOffer's receipt is null`)
            }
            await this.model.Project.getModel().findOneAndUpdate({_id: vote.project}, {updatedAt: new Date()})
            Queue.trigger(SCHEDULE_NAME.SYNC_PROJECT, {projectId: vote.project})
        } catch (error) {
            console.log(error)
            vote.status = CONSTANTS.EntityConst.VOTE.STATUS.FAILED
            vote.note = error.message
            await vote.save()
        }
    }

    processVoteRejectOffer = async(voteId) => {
        const vote = await this.model.Vote.getModel().findOne({_id: voteId}).populate('offer')
        if(!vote) {
            throw new Error(`Vote ${voteId} not found`)
        }

        try {
            const bcWallet = await this.model.BcWallet.findOne({user: vote.voter, inactive: false})
            if (!bcWallet) {
                console.error(`bcWallet of user ${vote.voter} not found`)
                return
            }

            console.log(`[ProjectContract] vote reject offer`)
            const receipt = await ContractProjectLib.voteRejectedOffer(vote.offer.index, Utils.Encrypt.decrypt(bcWallet.private_key), bcWallet.address)
            if(receipt && receipt.transactionHash) {
                console.log(receipt)
                vote.txid = receipt.transactionHash,
                vote.status = CONSTANTS.EntityConst.VOTE.STATUS.COMPLETED // TODO
                await vote.save()
            } else {
                throw new Error(`voteRejectOffer's receipt is null`)
            }

            await this.model.Project.getModel().findOneAndUpdate({_id: vote.project}, {updatedAt: new Date()})
            Queue.trigger(SCHEDULE_NAME.SYNC_PROJECT, {projectId: vote.project})
        } catch (error) {
            console.log(error)
            vote.status = CONSTANTS.EntityConst.VOTE.STATUS.FAILED
            vote.note = error.message
            await vote.save()
        }
    }

    processCancelVoteOffer = async(voteId) => {
        const vote = await this.model.Vote.getModel().findOne({_id: voteId}).populate('offer')
        if(!vote) {
            throw new Error(`Vote ${voteId} not found`)
        }

        try {
            const bcWallet = await this.model.BcWallet.findOne({user: vote.voter, inactive: false})
            if (!bcWallet) {
                console.error(`bcWallet of user ${vote.voter} not found`)
                return
            }

            console.log(`[ProjectContract] vote accept offer`)
            const receipt = await ContractProjectLib.cancelVoteOffer(vote.offer.index, Utils.Encrypt.decrypt(bcWallet.private_key), bcWallet.address)
            if(receipt && receipt.transactionHash) {
                console.log(receipt)
                vote.txid = receipt.transactionHash,
                vote.status = CONSTANTS.EntityConst.VOTE.STATUS.COMPLETED// TODO
                await vote.save()
            } else {
                throw new Error(`cancelVoteOffer's receipt is null`)
            }
            await this.model.Project.getModel().findOneAndUpdate({_id: vote.project}, {updatedAt: new Date()})
            Queue.trigger(SCHEDULE_NAME.SYNC_PROJECT, {projectId: vote.project})
        } catch (error) {
            console.log(error)
            vote.status = CONSTANTS.EntityConst.VOTE.STATUS.FAILED
            vote.note = error.message
            await vote.save()
        }
    }

    processClaimReward = async(claimId) => {
        const claim = await this.model.ClaimReward.getModel().findOne({_id: claimId}).populate('project')
        if(!claim) {
            throw new Error(`CLAIM ${claimId} not found`)
        }

        try {
            const bcWallet = await this.model.BcWallet.findOne({user: claim.user, inactive: false})
            if (!bcWallet) {
                console.error(`bcWallet of user ${claim.user} not found`)
                return
            }

            console.log(`[ProjectContract] claim reward `)
            const receipt = await ContractProjectLib.claimReward(
                claim.project && claim.project.no, 
                claim.amount, 
                Utils.Encrypt.decrypt(bcWallet.private_key), 
                bcWallet.address
                )
            if(receipt && receipt.transactionHash && receipt.status == true) {
                console.log(receipt)
                console.log(claim)
                claim.txid = receipt.transactionHash.toString(),
                claim.status = CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING // TODO
                console.log(claim)
                await claim.save()
            } else {
                throw new Error(`claimReward's receipt is null`)
            }
            await this.model.Project.getModel().findOneAndUpdate({_id: claim.project._id}, {updatedAt: new Date()})
            Queue.trigger(SCHEDULE_NAME.SYNC_PROJECT, {projectId: claim.project._id})
            Queue.trigger(SCHEDULE_NAME.PROJECT_CONFIRM_CLAIM_FINALIZE_JOB, {jobId: claimId})

        } catch (error) {
            console.log(error)
            claim.status = CONSTANTS.EntityConst.PROJECT.STATUS.FAILED
            claim.note = error.message
            await claim.save()
        }
    }
}

module.exports = ContractProjectAction
