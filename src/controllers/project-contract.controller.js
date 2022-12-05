const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const Uuid = require('uuid').v4
const util = require('util')
//util
const Utils = require('../utils')
const CONSTANTS = require('../constants')
const { Lang, EntityConst } = CONSTANTS
const { RestError, ResponseFormat } = require('../utils')
const S3 = require('../utils/s3.util')
const Promise = require('bluebird')
const ROLES = EntityConst.USER.ROLES
const { ContractProjectLib } = require('../services/project/RexProjectContract.lib')
const { RexProjectContract } = require('../services/project')
const Queue = require('../services/queue')
const { CacheService } = require('../services/cache')
const BscService = require('../services/web3/bsc/bsc')
const {round} = require("lodash")  
const { SCHEDULE_NAME } = require('../constants/job.constant')
const { normalizeTokenAmount } = require('../utils/token.util')

class ProjectContract {
    constructor(opts) {
        this.model = opts.model
        this.action = opts.action
    }

    getBuyerOffer = async ({ user, symbol, query, limit=10, page=1, history=false }) => {
        const data = []
        const skip =  (page-1) * limit

        try {
            symbol && (query.symbol = symbol)
            if(!history) {
                query.end = { $gt: round(Date.now()/1000) }
            }
            const total = await this.model.Offer.getModel().count(query)
            const offers = await this.model.Offer.getModel().find(query)
            .skip(skip).limit(limit)
            .sort({createdAt:-1}).select('index').lean()

            for (const offer of offers) {
                console.log(offer)
                const index = offer.index
                let offerDetail = null
                try {
                    offerDetail = await ContractProjectLib.getBuyerOffer(index)
                } catch (error) {
                    console.log(error.message)
                }
                if(!offerDetail || !offerDetail.symbol) continue
                const stockInfo = await this.model.Stock.getModel().findOne({
                    symbol: offerDetail.symbol
                })

                const project = await this.model.Project.getModel().findOne({
                    no: offerDetail.symbol
                }).select('name').lean()

                if(!stockInfo || !project) continue
                let status = '' // pending, voting, voted, expired  
                const now = Date.now()/1000
                if(now < Number(offerDetail.start)) {
                    status = 'pending';
                } else if (Number(offerDetail.accepted) == Number(stockInfo.total_supply)) {
                    status = 'voted';
                } else if(now > Number(offerDetail.end)) {
                    status = 'expired';
                } else {
                    status = 'voting';
                }

                data.push({
                    ...offerDetail,
                    stockInfo,
                    status,
                    projectName: project.name
                })

                Queue.trigger(SCHEDULE_NAME.SYNC_PROJECT, {projectId: stockInfo.project})
            }

            return ResponseFormat.formatResponse(200, 'OK', {
                offers: data,
                total
            })
        } catch (error) {
            throw error
        }
    }

    adminAddBuyerOffer = async ({ user, buyer, symbol, offerValue, startTimeSecond, endTimeSecond }) => {
        let offer = null

        try {
            // verify symbol
            const project = await this.model.Project.getModel().findOne({ no: symbol })
            if (!project) {
                throw RestError.NewNotAcceptableError(`Project symbol ${symbol} not found!`)
            }
            const receipt = await ContractProjectLib.addBuyerOffer(
                buyer, 
                symbol, 
                normalizeTokenAmount(offerValue), 
                startTimeSecond, 
                endTimeSecond
                )
            if (receipt && receipt.transactionHash) {
                offer = await this.model.Offer.getModel().create([{
                    project: project._id,
                    buyer,
                    symbol,
                    offerValue,
                    totalVoter: 0,
                    txid: receipt.transactionHash,
                    status: CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING // TODO
                }])

                await this.model.Project.getModel().findOneAndUpdate({_id: project._id}, { updatedAt: new Date() })
                Queue.trigger(SCHEDULE_NAME.SYNC_PROJECT, {projectId: project._id})
            }
            return ResponseFormat.formatResponse(200, 'OK', {
                data: offer
            })
        } catch (error) {
            throw error
        }
    }

    adminCancelBuyerOffer = async ({ user, index }) => {
        let updatedOffer = null

        try {
            // verify symbol
            const offer = await this.model.Offer.getModel().findOne({ index })
            if (!offer) {
                throw RestError.NewNotAcceptableError(`Offer index ${index} not found!`)
            }
            if (offer.status != CONSTANTS.EntityConst.PROJECT.STATUS.FINISHED) {
                throw RestError.NewNotAcceptableError(`Offer index ${index} not valid!`)
            }
            const receipt = await ContractProjectLib.cancelOffer(offer.index)
            if (receipt && receipt.transactionHash) {
                // offer.status = CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING
                offer.txid = `${offer.txid},${receipt.transactionHash}`
                updatedOffer = await offer.save({ new: true })

                await this.model.Project.getModel().findOneAndUpdate({_id: offer.project}, { updatedAt: new Date() })
                Queue.trigger(SCHEDULE_NAME.SYNC_PROJECT,  {projectId: project._id})
            }
            return ResponseFormat.formatResponse(200, 'OK', {
                data: updatedOffer
            })
        } catch (error) {
            throw error
        }
    }

    getVote = async ({ user }) => {
        let vote = null

        try {
            // verify symbol
            const vote = await this.model.Vote.getModel().find({
                voter: user._id
            }).limit(500).sort({ createdAt: -1 }).populate('project', 'no name total_claim_value  total_claimed accept_offer status').lean()

            if (!vote) {
                throw RestError.NewNotAcceptableError(`Vote of user ${user._id} not found!`)
            }

            return ResponseFormat.formatResponse(200, 'OK', {
                data: vote
            })
        } catch (error) {
            throw error
        }
    }

    checkVote = async ({ user, index }) => {
        try {
            let vote = await this.model.Vote.getModel().findOne({ voter: user._id, index: index, cancelled: false })
            if (!vote || (!vote && vote.status == EntityConst.VOTE.STATUS.FAILED)) {
                return ResponseFormat.formatResponse(200, 'OK', {
                    isVoted: false,
                    voteStatus: vote ? vote.status : null
                })
            }
            return ResponseFormat.formatResponse(200, 'OK', {
                isVoted: true,
                voteStatus: vote.status
            })
        } catch (error) {
            throw error
        }
    }


    voteAcceptOffer = async ({ user, index }) => {
        let vote = null

        try {
            // verify symbol
            const offer = await this.model.Offer.getModel().findOne({ index }).populate('project')
            if (!offer) {
                throw RestError.NewNotAcceptableError(`Offer id ${index} not found!`)
            }
            if (offer.status != CONSTANTS.EntityConst.PROJECT.STATUS.FINISHED) {
                throw RestError.NewNotAcceptableError(`Offer id ${index} not valid!`)
            }

            // Send bnb to target user
            const bcWallet = await this.model.BcWallet.findOne({ user: user._id, inactive: false })
            if (!bcWallet) {
                console.error(`bcWallet of user ${user._id} not found`)
                return
            }
            await BscService.ensureBnbFee(bcWallet.address)

            vote = await this.model.Vote.getModel().create([{
                project: offer.project._id,
                offer: offer._id,
                voter: user._id,
                result: true,
                status: CONSTANTS.EntityConst.PROJECT.STATUS.PENDING
            }])

            await this.model.Project.getModel().findOneAndUpdate({_id: offer.project._id}, { updatedAt: new Date() })
            Queue.add(CONSTANTS.JobConst.QUEUE_NAME.CONTRACT_VOTE_ACCEPT_OFFER, { voteId: vote[0]._id })

            return ResponseFormat.formatResponse(200, 'OK', {
                data: vote[0]
            })
        } catch (error) {
            throw error
        }
    }

    voteRejectOffer = async ({ user, index }) => {
        let vote = null

        try {
            // verify symbol
            const offer = await this.model.Offer.getModel().findOne({ index }).populate('project')
            if (!offer) {
                throw RestError.NewNotAcceptableError(`Offer id ${index} not found!`)
            }
            if (offer.status != CONSTANTS.EntityConst.PROJECT.STATUS.FINISHED) {
                throw RestError.NewNotAcceptableError(`Offer id ${index} not valid!`)
            }

            // Send bnb to target user
            const bcWallet = await this.model.BcWallet.findOne({ user: user._id, inactive: false })
            if (!bcWallet) {
                console.error(`bcWallet of user ${user._id} not found`)
                return
            }
            await BscService.ensureBnbFee(bcWallet.address)

            vote = await this.model.Vote.getModel().create([{
                project: offer.project._id,
                offer: offer._id,
                voter: user._id,
                result: false,
                status: CONSTANTS.EntityConst.PROJECT.STATUS.PENDING
            }])

            await this.model.Project.getModel().findOneAndUpdate({_id: offer.project._id}, { updatedAt: new Date() })
            Queue.add(CONSTANTS.JobConst.QUEUE_NAME.CONTRACT_VOTE_REJECT_OFFER, { voteId: vote[0]._id })

            return ResponseFormat.formatResponse(200, 'OK', {
                data: vote[0]
            })
        } catch (error) {
            throw error
        }
    }

    cancelVoteOffer = async ({ user, index }) => {
        let vote = null

        try {
            // verify symbol
            const offer = await this.model.Offer.getModel().findOne({ index }).populate('project')
            if (!offer) {
                throw RestError.NewNotAcceptableError(`Offer id ${index} not found!`)
            }
            if (offer.status != CONSTANTS.EntityConst.PROJECT.STATUS.FINISHED) {
                throw RestError.NewNotAcceptableError(`Offer id ${index} not valid!`)
            }

            // Send bnb to target user
            const bcWallet = await this.model.BcWallet.findOne({ user: user._id, inactive: false })
            if (!bcWallet) {
                console.error(`bcWallet of user ${user._id} not found`)
                return
            }
            await BscService.ensureBnbFee(bcWallet.address)

            vote = await this.model.Vote.getModel().create([{
                project: offer.project._id,
                offer: offer._id,
                voter: user._id,
                cancelled: true,
                status: CONSTANTS.EntityConst.PROJECT.STATUS.PENDING
            }])

            await this.model.Project.getModel().findOneAndUpdate({_id: offer.project._id}, { updatedAt: new Date() })
            Queue.add(CONSTANTS.JobConst.QUEUE_NAME.CONTRACT_CANCEL_VOTE_OFFER, { voteId: vote[0]._id })

            return ResponseFormat.formatResponse(200, 'OK', {
                data: vote[0]
            })
        } catch (error) {
            throw error
        }
    }

    adminDistributeProject = async ({ user, symbol, usdtrexRatio }) => {
        let project = null

        try {
            // verify symbol
            project = await this.model.Project.getModel().findOne({ no: symbol })
            if (!project) {
                throw RestError.NewNotAcceptableError(`Project symbol ${symbol} not found!`)
            }
            const receipt = await ContractProjectLib.distributeProject(symbol, normalizeTokenAmount(usdtrexRatio))
            if (!receipt || !receipt.transactionHash) {
                throw RestError.NewInternalServerError(`Receipt of distributeProject request is null`)
            }

            project.updatedAt = new Date()
            await project.save()
            Queue.trigger(SCHEDULE_NAME.SYNC_PROJECT, {projectId: project._id})
            // setTimeout(() => {
            //     Queue.add(CONSTANTS.JobConst.QUEUE_NAME.SYNC_PROJECT_DETAIL, {project: project._id})
            // }, 30000) // waiting for blockchain confirmation after 30 second

            // TODO register to sync 

            return ResponseFormat.formatResponse(200, 'OK', {
                data: {
                    project,
                    receipt
                }
            })
        } catch (error) {
            throw error
        }
    }

    adminRefundProject = async ({ user, symbol }) => {
        let project = null

        try {
            // verify symbol
            project = await this.model.Project.getModel().findOne({ no: symbol })
            if (!project) {
                throw RestError.NewNotAcceptableError(`Project symbol ${symbol} not found!`)
            }
            const receipt = await ContractProjectLib.refundProject(symbol)
            if (!receipt || !receipt.transactionHash) {
                throw RestError.NewInternalServerError(`Receipt of distributeProject request is null`)
            }

            project.updatedAt = new Date()
            await project.save()
            Queue.trigger(SCHEDULE_NAME.SYNC_PROJECT, {projectId: project._id})
            // setTimeout(() => {
            //     Queue.add(CONSTANTS.JobConst.QUEUE_NAME.SYNC_PROJECT_DETAIL, {project: project._id})
            // }, 30000) // waiting for blockchain confirmation after 30 second

            // TODO register to sync 

            return ResponseFormat.formatResponse(200, 'OK', {
                data: {
                    project,
                    receipt
                }
            })
        } catch (error) {
            throw error
        }
    }

    getClaimReward = async ({ user }) => {
        try {
            // verify symbol
            const claim = await this.model.ClaimReward.getModel().find({
                user: user._id
            }).limit(500).sort({ createdAt: -1 }).populate('project', 'no name total_claim_value  total_claimed accept_offer status').lean()

            if (!claim) {
                throw RestError.NewNotAcceptableError(`claim of user ${user._id} not found!`)
            }

            return ResponseFormat.formatResponse(200, 'OK', {
                data: claim
            })
        } catch (error) {
            throw error
        }
    }

    claimReward = async ({ user, symbol, amount }) => {
        let claim = null

        try {
            // verify symbol
            const project = await this.model.Project.getModel().findOne({ no: symbol })
            if (!project) {
                throw RestError.NewNotAcceptableError(`Project symbol ${symbol} not found!`)
            }

            // Send bnb to target user
            const bcWallet = await this.model.BcWallet.findOne({ user: user._id, inactive: false })
            if (!bcWallet) {
                console.error(`bcWallet of user ${user._id} not found`)
                return
            }
            await BscService.ensureBnbFee(bcWallet.address)

            claim = await this.model.ClaimReward.getModel().findOne({
                project: project._id,
                user: user._id,
                status: { $in: [
                    CONSTANTS.EntityConst.CLAIM.STATUS.PROCESSING,
                    CONSTANTS.EntityConst.CLAIM.STATUS.PENDING
                ]}
            })

            if(claim) {
                throw RestError.NewNotAcceptableError(`Claim is in processing ${claim.status}`)
            }

            claim = await this.model.ClaimReward.getModel().create([{
                project: project._id,
                user: user._id,
                amount,
                status: CONSTANTS.EntityConst.CLAIM.STATUS.PENDING
            }])

            await this.model.Project.getModel().findOneAndUpdate({_id: project._id}, { updatedAt: new Date() })
            Queue.add(CONSTANTS.JobConst.QUEUE_NAME.CONTRACT_CLAIM_REWARD, { claimId: claim[0]._id })

            return ResponseFormat.formatResponse(200, 'OK', {
                data: claim[0]
            })
        } catch (error) {
            throw error
        }
    }

    checkUnclaimed = async ({ user, symbol }) => {
        try {
            // verify symbol
            const project = await this.model.Project.getModel().findOne({ no: symbol })
            if (!project) {
                throw RestError.NewNotAcceptableError(`Project symbol ${symbol} not found!`)
            }

            const bcWallet = await this.model.BcWallet.findOne({ user: user._id, inactive: false })
            if (!bcWallet) {
                console.error(`bcWallet of user ${user._id} not found`)
                return
            }

            //check stock balance
            let stockBalance = await ContractProjectLib.getClaimInfo(symbol, bcWallet.address)
            return ResponseFormat.formatResponse(200, 'OK', {
                stockBalance: Number(stockBalance.amountStock)
            })

        } catch (error) {
            throw error
        }
    }

}

module.exports = ProjectContract
