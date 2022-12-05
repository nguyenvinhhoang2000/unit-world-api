const Queue = require('../services/queue')
const {QUEUE_NAME, SCHEDULE_NAME} = require('../constants/job.constant')
const CONSTANTS = require('../constants')
const {ContractProjectLib} = require('../services/project/RexProjectContract.lib')
const {ContractTokenLib} = require('../services/project/UsdrTokenContract.lib')
const container = require('../configs/dependencies/container')
const model = container.resolve('model')
const action = container.resolve('action')
const Utils = require('../utils')
const BscService = require('../services/web3/bsc/bsc')
const { normalizeTokenAmount } = require('../utils/token.util')

const REX_CONTRACT = process.env[`${process.env.MODE}_REX_CONTRACT`]

module.exports = () => {
    console.log('Register contract create project.')

    Queue.register(QUEUE_NAME.CONTRACT_CREATE_PROJECT, async ({project_id}) => {
        try {
            const project = await model.Project.getModel().findOne({_id: project_id}).populate('stock_info').lean()
            if (!project || !project.stock_info) {
                throw new Error(`Project or stock info of  ${project_id} not found`)
            }

            const data = {
                _symbol: project.no,
                _lockedTime: project.time_config.invest_duration,
                _startTime: Math.round(new Date(project.time_config.open).getTime() / 1000),
                _endTime: Math.round(new Date(project.time_config.close).getTime() / 1000),
                _expectedInterestRate: project.expected_interest_rate * 100,
                _circulatingSupply: project.stock_info.circulating_supply,
                _totalSupply: project.stock_info.total_supply,
                _idoPrice: normalizeTokenAmount(project.stock_info.ido_price ? project.stock_info.ido_price : 1),
                _minBuyIdo: 1, // TODO: FIXME
                _maxBuyIdo: project.stock_info.total_supply, // TODO: FIXME
            }
            const newContract = await ContractProjectLib.createProject(data)
            if (!newContract) throw new Error('Failed to create new project contract')
            await model.Project.getModel().findOneAndUpdate(
                {_id: project_id},
                {status: CONSTANTS.EntityConst.PROJECT.STATUS.PENDING, msg: newContract.transactionHash},
            )

            console.log(`Published project id ${newContract.transactionHash}`)
            // TODO: for test only, sync event from blockchain
            await model.Project.getModel().findOneAndUpdate(
                {_id: project_id, status: CONSTANTS.EntityConst.PROJECT.STATUS.PENDING},
                {status: CONSTANTS.EntityConst.PROJECT.STATUS.PROCESSING},
            )
            console.log(`Create new project successfully at ${newContract.transactionHash}`)
        } catch (error) {
            await model.Project.getModel().findOneAndUpdate(
                {_id: project_id},
                {status: CONSTANTS.EntityConst.PROJECT.STATUS.FAILED, msg: error.message},
            )
            console.log(error)
        }
    })


    Queue.register(QUEUE_NAME.CONTRACT_ADD_WHITELIST, async ({address}) => {
        try {
            const result = await ContractProjectLib.addWhitelist([address])
            console.log(result)
            console.log(`[Project] Added whitelist for ${address}`)
        } catch (error) {
            console.log(error)
        }
    })

    Queue.register(QUEUE_NAME.CONTRACT_BUY_IDO_PREPARE, async ({order_id}) => {
        try {
            const order = await model.Order.getModel().findOne({_id: order_id}).lean()
            if (!order) {
                console.error(`Order of  ${order_id} not found`)
                return
            }

            if (order.type != CONSTANTS.Market.ORDER.BUY && order.status != CONSTANTS.Market.ORDER_STATUS.PENDING) {
                console.error(`Order ${order_id} invalid`)
                return
            }

            const buyerWallet = await model.BcWallet.findOne({user: order.owner, inactive: false})
            if (!buyerWallet) {
                console.error(`buyerWallet of ${order.owner} not found`)
                return
            }

            // Send bnb to target user
            await BscService.ensureBnbFee(buyerWallet.address)

            // approve if not
            await BscService.ensureTokenApproval(buyerWallet, REX_CONTRACT , CONSTANTS.EntityConst.TOKEN.USDR)

            // Mark preparation done, add queue to buy IDO
            await model.Order.getModel().findOneAndUpdate(
                {_id: order_id},
                {
                    status: CONSTANTS.Market.ORDER_STATUS.PREPARING,
                },
            )

            await Queue.add(QUEUE_NAME.CONTRACT_BUY_IDO, {order_id})

            console.log(`Buy IDO prepared gas fee`)
        } catch (error) {
            await model.Order.getModel().findOneAndUpdate(
                {_id: order_id},
                {status: CONSTANTS.Market.ORDER_STATUS.FAILED, msg: error.message},
            )
            console.log(error.message)
        }
    })

    Queue.register(QUEUE_NAME.CONTRACT_BUY_IDO, async ({order_id}) => {
        let order = null
        let updateContract = null
        try {
            order = await model.Order.getModel().findOne({_id: order_id}).lean()
            if (!order) {
                console.error(`Order of  ${order_id} not found`)
                return
            }

            if (order.type != CONSTANTS.Market.ORDER.BUY && order.status != CONSTANTS.Market.ORDER_STATUS.PREPARING) {
                console.error(`Order ${order_id} invalid`)
                return
            }

            const buyerWallet = await model.BcWallet.findOne({user: order.owner, inactive: false})
            if (!buyerWallet) {
                console.error(`buyerWallet of ${order.owner} not found`)
                return
            }

            data = {
                _symbol: order.symbol,
                _amount: order.quantity,
                privateKey: Utils.Encrypt.decrypt(buyerWallet.private_key),
                from: buyerWallet.address,
            }

            console.log({data})
            updateContract = await ContractProjectLib.buyIdo(data)
            console.log(updateContract)
            if (!updateContract) throw new Error('Failed to create new project contract')
            await model.Order.getModel().findOneAndUpdate(
                {_id: order_id},
                {status: CONSTANTS.Market.ORDER_STATUS.PROCESSING, msg: updateContract.transactionHash},
            )


            await model.Project.getModel().findOneAndUpdate({_id: order.project}, {updatedAt: new Date()})
            Queue.trigger(SCHEDULE_NAME.PROJECT_CONFIRM_IDO_FINALIZE_JOB, {jobId: order_id})

            console.log(`Buy IDO via contract processing at ${updateContract.transactionHash}`)
        } catch (error) {
            await model.Order.getModel().findOneAndUpdate(
                {_id: order_id},
                {status: CONSTANTS.Market.ORDER_STATUS.FAILED, msg: error.message},
            )
            console.log(error.message)
        }
    })


    Queue.register(QUEUE_NAME.CONTRACT_VOTE_ACCEPT_OFFER, async ({voteId}) => {
        try {
            const result = await action.ContractProject.processVoteAcceptOffer(voteId)
            console.log(result)
            console.log(`[Project] CONTRACT_VOTE_ACCEPT_OFFER ${voteId}`)
        } catch (error) {
            console.log(error)
        }
    })

    Queue.register(QUEUE_NAME.CONTRACT_VOTE_REJECT_OFFER, async ({voteId}) => {
        try {
            const result = await action.ContractProject.processVoteRejectOffer(voteId)
            console.log(result)
            console.log(`[Project] CONTRACT_VOTE_REJECT_OFFER ${voteId}`)
        } catch (error) {
            console.log(error)
        }
    })

    Queue.register(QUEUE_NAME.CONTRACT_CANCEL_VOTE_OFFER, async ({voteId}) => {
        try {
            const result = await action.ContractProject.processCancelVoteOffer(voteId)
            console.log(result)
            console.log(`[Project] CONTRACT_CANCEL_VOTE_OFFER ${voteId}`)
        } catch (error) {
            console.log(error)
        }
    })

    Queue.register(QUEUE_NAME.CONTRACT_CLAIM_REWARD, async ({claimId}) => {
        try {
            const result = await action.ContractProject.processClaimReward(claimId)
            console.log(result)
            console.log(`[Project] CONTRACT_CLAIM_REWARD ${claimId}`)
        } catch (error) {
            console.log(error)
        }
    })
}
