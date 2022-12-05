require('dotenv').config()
const CronJob = require('cron').CronJob

const BigNumber = require('bignumber.js')

const container = require('../../../configs/dependencies/container')
const model = container.resolve('model')

const {EntityConst} = require('../../../constants')
const {getWeb3} = require('../../web3')
const {tokenContract} = require('../../web3/contract/index')

const BreMarketContract = tokenContract(process.env)

const {Sqs} = require('../../../utils')
const {Queue} = require('../../../constants')

const sleep = async (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

const processEventBlock = async (web, blocks) => {
    try {
        console.log('\tScan from ', blocks[0], ' to ', blocks[blocks.length - 1])
        await Promise.all([
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.CREATE_PROJECT),
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.DELETE_PROJECT),
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.UPDATE_IDO_INFO),
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.BUY_IDO),
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.ADD_BUYER_OFFER),
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.PROJECT_SOLD),
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.VOTE_ACCEPTED),
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.VOTE_REJECTED),
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.CANCELED_VOTE),
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.CANCELED_OFFER),
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.DISTRIBUTED_PROJECT),
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.CLAIM_REWARD),
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.EXCHANGE_STOCK),
            _getEvent(blocks, EntityConst.MARKET.EVENT.TYPE.EXCHANGE_P2P_STOCK_FIAT),
        ])
    } catch (error) {
        console.log(error.error)
    }
}

const _getEvent = async (blocks, eventName) => {
    try {
        const pastEvents = await smartcontract.DepositContract.getPastEvents(eventName, {
            fromBlock: blocks[0],
            toBlock: blocks[blocks.length - 1],
        })
        if (pastEvents == null || pastEvents.length == 0) {
            return
        }
        console.log(pastEvents)

        for (let i = 0; i < pastEvents.length; i++) {
            let pastEvent = pastEvents[i]
            let marketEvent = await model.MarketEvent.findOne({txId: pastEvent.transactionHash, log_id: pastEvent.id})

            if (!marketEvent) {
                //add to queue
                Sqs.sendTransaction(Queue.MARKET_EVENT, {pastEvent, eventName})
            }
        }
    } catch (error) {
        console.log(error.message)
    }
}

let blockStart
let delayBlockNumber = 2
let bscScanConfig
let paused = false
const transactionSuccessJob = new CronJob(
    '*/10 * * * * *',
    async function () {
        try {
            if (paused) {
                return
            }
            paused = true
            console.log('*************************************************************')
            console.log('\tProcess Binance scan success transactions sercive at ' + new Date().getTime())

            if (!bscScanConfig) {
                bscScanConfig = await model.SystemSetting.findOne({
                    key: 'SCAN_BSC_MARKET',
                })
                blockStart = Number(bscScanConfig.value.block)
                delayBlockNumber = bscScanConfig.value.confirmation
            }
            const currentBlockNumber = await bscWeb3[1].eth.getBlockNumber()
            console.log(`current block number is `, currentBlockNumber)
            if (currentBlockNumber) {
                let blockEnd = currentBlockNumber - delayBlockNumber
                blockEnd = blockEnd - blockStart > 1000 ? blockStart + 1000 : blockEnd
                console.log(`blockStart =`, blockStart)
                console.log(`blockEnd =`, blockEnd)

                await processEventBlock(1, [blockStart, blockEnd - 1])
                //update block scan
                await model.SystemSetting.findOneAndUpdate(
                    {key: 'SCAN_BSC_MARKET'},
                    {
                        value: {
                            block: blockEnd,
                            confirmation: delayBlockNumber,
                        },
                    },
                )
                blockStart = blockEnd
            } else {
                await sleep(3000)
            }
            paused = false
        } catch (e) {
            paused = false
            console.error(e.message)
            // logger.info({ message: e.message }, { service: 'transaction-success-scanning', phase: 'scan-failed', timestamp: new Date() })
        }
    },
    null,
    true,
    'America/Los_Angeles',
)

transactionSuccessJob.start()
