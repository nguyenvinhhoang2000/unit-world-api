require('dotenv').config()
const {Sqs} = require('../../../utils')
const {Queue, EntityConst} = require('../../../constants')
const container = require('../../../configs/dependencies/container')
const model = container.resolve('model')

const _getMarketEvent = async () => {
    try {
        let data = await Sqs.receiveTransaction(Queue.MARKET_EVENT, 5)
        if (data && data.Messages && data.Messages.length > 0) {
            let marketEvents = JSON.parse(data.Messages) //process transaction
            return marketEvents
        }
        return null
    } catch (error) {
        console.log(error)
        return null
    }
}

const _processMarketEvent = async (marketEvent) => {
    try {
        //save db
        try {
            await model.MarketEvent.createOne({
                txId: marketEvent.pastEvent.transactionHash,
                log_id: marketEvent.pastEvent.id,
                blockNumber: marketEvent.pastEvent.blockNumber,
                type: marketEvent.eventName,
                dataEvent: marketEvent.pastEvent,
                version: 1,
            })
        } catch (error) {
            throw new Error(`${marketEvent.pastEvent.id} is existed`)
        }
        switch (marketEvent.eventName) {
            case EntityConst.MARKET.EVENT.TYPE.CREATE_PROJECT:
                await _createProject(marketEvent.pastEvent)
                break
            case EntityConst.MARKET.EVENT.TYPE.DELETE_PROJECT:
                await _deleteProject(marketEvent.pastEvent)
                break
            case EntityConst.MARKET.EVENT.TYPE.UPDATE_IDO_INFO:
                break
            case EntityConst.MARKET.EVENT.TYPE.BUY_IDO:
                break
            case EntityConst.MARKET.EVENT.TYPE.ADD_BUYER_OFFER:
                break
            case EntityConst.MARKET.EVENT.TYPE.PROJECT_SOLD:
                break
            case EntityConst.MARKET.EVENT.TYPE.VOTE_ACCEPTED:
                break
            case EntityConst.MARKET.EVENT.TYPE.VOTE_REJECTED:
                break
            case EntityConst.MARKET.EVENT.TYPE.CANCELED_VOTE:
                break
            case EntityConst.MARKET.EVENT.TYPE.CANCELED_OFFER:
                break
            case EntityConst.MARKET.EVENT.TYPE.DISTRIBUTED_PROJECT:
                break
            case EntityConst.MARKET.EVENT.TYPE.CLAIM_REWARD:
                break
            case EntityConst.MARKET.EVENT.TYPE.EXCHANGE_STOCK:
                break
            case EntityConst.MARKET.EVENT.TYPE.EXCHANGE_P2P_STOCK_FIAT:
                break
            default:
                break
        }
    } catch (error) {
        console.log(error)
    }
}

const _createProject = async (pastEvent) => {
    try {
        //check project
        let project = await model.Project.findOneAndUpdate(
            {symbol: pastEvent.returnValues.symbol, status: EntityConst.PROJECT.STATUS.PENDING},
            {
                status: EntityConst.PROJECT.STATUS.PROCESSING,
            },
        )
        if (project) {
            console.log(`[${new Date()}] - CREATE_PROJECT SUCCEEDED - ${pastEvent.returnValues.symbol}`)
        } else {
            console.log(`[${new Date()}] - CREATE_PROJECT ERROR - ${pastEvent.returnValues.symbol} is existed`)
        }
    } catch (error) {
        console.log(error)
    }
}

const _deleteProject = async (pastEvent) => {
    try {
        //check project
        let project = await model.Project.findOneAndUpdate(
            {
                symbol: pastEvent.returnValues.symbol,
                status: {
                    $in: [EntityConst.PROJECT.STATUS.PENDING, EntityConst.PROJECT.STATUS.WAITING],
                },
            },
            {
                status: EntityConst.PROJECT.STATUS.CANCELED,
            },
        )
        if (project) {
            console.log(`[${new Date()}] - DELETE_PROJECT SUCCEEDED - ${pastEvent.returnValues.symbol}`)
        } else {
            console.log(`[${new Date()}] - DELETE_PROJECT ERROR - ${pastEvent.returnValues.symbol} is existed`)
        }
    } catch (error) {
        console.log(error)
    }
}

const _updateIdoInfo = async (pastEvent) => {
    try {
        //check project
        let project = await model.Project.findOneAndUpdate(
            {
                symbol: pastEvent.returnValues.symbol,
                status: {
                    $in: [EntityConst.PROJECT.STATUS.PENDING, EntityConst.PROJECT.STATUS.WAITING],
                },
            },
            {
                status: EntityConst.PROJECT.STATUS.CANCELED,
            },
        )
        if (project) {
            console.log(`[${new Date()}] - DELETE_PROJECT SUCCEEDED - ${pastEvent.returnValues.symbol}`)
        } else {
            console.log(`[${new Date()}] - DELETE_PROJECT ERROR - ${pastEvent.returnValues.symbol} is existed`)
        }
    } catch (error) {
        console.log(error)
    }
}

const _buyIdo = async (pastEvent) => {
    try {
        //check project
        let project = await model.Project.findOneAndUpdate(
            {
                symbol: pastEvent.returnValues.symbol,
                status: {
                    $in: [EntityConst.PROJECT.STATUS.PENDING, EntityConst.PROJECT.STATUS.WAITING],
                },
            },
            {
                status: EntityConst.PROJECT.STATUS.CANCELED,
            },
        )
        if (project) {
            console.log(`[${new Date()}] - DELETE_PROJECT SUCCEEDED - ${pastEvent.returnValues.symbol}`)
        } else {
            console.log(`[${new Date()}] - DELETE_PROJECT ERROR - ${pastEvent.returnValues.symbol} is existed`)
        }
    } catch (error) {
        console.log(error)
    }
}

const _deleteTransaction = async (receiptHandle) => {
    const data = await Sqs.deleteTransaction(Queue.MARKET_EVENT, receiptHandle)
    console.log(data)
}

const sleep = async (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

const run = async () => {
    try {
        let marketEvents = await _getMarketEvent()
        if (marketEvents.length == 0) {
            await sleep(3000)
        } else {
            //process marketEvent
            await Promise.all(
                marketEvents.map((ele) => {
                    _processMarketEvent(ele.Body)
                    _deleteTransaction(ele.ReceiptHandle)
                }),
            )
        }
        await run()
    } catch (error) {
        console.log(error)
        await sleep(30000)
        run()
    }
}
run()
