require('dotenv').config()
const BigNumber = require('bignumber.js')
const Promise = require('bluebird')

const {TokenConst, EntityConst} = require('../../../../constants')
const {QUEUE_NAME} = require('../../../../constants/job.constant')

const container = require('../../../../configs/dependencies/container')
const model = container.resolve('model')

const {getWeb3, listWeb3, delistWeb3} = require('../../index')
const Queue = require('../../../queue')
const {CacheService} = require('../../../cache')

const USDT_BSC_ABI = require('../../contract/usdt-bsc.abi.json')
const USDR_BSC_ABI = require('../../contract/bre_bsc.abi.json')
const REX_BSC_ABI = require('../../contract/rex_bsc.abi.json')
const { getEnv } = require('../../../../utils/getEnv.util')
const USDT_BSC_CONTRACT = getEnv('USDT_TOKEN') //usdt
const USDR_BSC_CONTRACT = getEnv('USDR') //usdr
const REX_BSC_CONTRACT = getEnv('REX_TOKEN') //bre
const REX_BSC_PROJECT_CONTRACT = getEnv('REX_CONTRACT') //bre
const OWNER_ADDRESS = getEnv('OWNER_ADDRESS')

const SUPPORTED_SCAN_TOKEN = [
    {
        token_name: 'USDT',
        token_address: USDT_BSC_CONTRACT,
        token_abi: USDT_BSC_ABI,
        decimal: 18,
    },
    {
        token_name: 'USDR',
        token_address: USDR_BSC_CONTRACT,
        token_abi: USDR_BSC_ABI,
        decimal: 18,
    },
    {
        token_name: 'REX',
        token_address: REX_BSC_CONTRACT,
        token_abi: REX_BSC_ABI,
        decimal: 18,
    },
]

const TIMEOUT = 120 //sec

let transactionData = []

function dividedDecimals(number, decimal = 18) {
    return BigNumber(number).dividedBy(Math.pow(10, decimal)).toFixed(6)
}

function splitToQueue(data, numberOfQueue) {
    let queueData = {}
    const avgDataLength = data.length / numberOfQueue
    Array.from({length: numberOfQueue}).forEach((_, index) => {
        queueData[index] = data.slice(Math.floor(index * avgDataLength), Math.floor((index + 1) * avgDataLength))
    })

    return queueData
}

async function processEventBlock(eth, blocks, token) {
    //console.log('[BscService] Scan from ', blocks[0], ' to ', blocks[blocks.length - 1])
    const {token_name, token_address, token_abi, decimal} = token

    const tokenContract = new eth.Contract(token_abi, token_address)
    if (blocks[0] && blocks[blocks.length - 1]) {
        const pastEvents = await tokenContract.getPastEvents('Transfer', {
            fromBlock: blocks[0],
            toBlock: blocks[blocks.length - 1],
        })
        if (pastEvents == null || pastEvents.length == 0) {
            //console.log('\t dont have event from ', blocks[0], ' to ', blocks[blocks.length - 1])
            return
        }
        //console.log('\t got pastEvents length=', pastEvents.length)

        for (const pastEvent of pastEvents) {
            const amount = dividedDecimals(pastEvent.returnValues.value, decimal)

            if(!pastEvent.returnValues || [ // only credit in case of user deposits, ignore credit from system
                '0x0000000000000000000000000000000000000000',
                OWNER_ADDRESS.toLowerCase(),
                REX_BSC_PROJECT_CONTRACT.toLowerCase()
            ].includes(pastEvent.returnValues.from.toLowerCase())) {
                console.log(`[BSC Scan] IGNORE transfer from system`)
                continue
            }

            if (amount > 0) {
                //more than 3 usdt
                const tranData = {
                    txId: pastEvent.transactionHash,
                    gateway: 'BSC',
                    type: EntityConst.TRANSACTION.TYPE.DEPOSIT,
                    from: pastEvent.returnValues.from,
                    to: pastEvent.returnValues.to,
                    amount: amount,
                    blockNumber: pastEvent.blockNumber,
                    currency: {
                        symbol: token_name,
                        token_address,
                    },
                    ratePrice: 1,
                    isCollected: false,
                }
                transactionData.push(tranData)
            }
        }
    }
}

const _processData = async (trans, lastBlock) => {
    try {
        const toAddresses = trans.map((tx) => tx.to)

        let addressesList = await model.BcWallet.getModel()
            .find({
                address: {
                    $in: toAddresses ? toAddresses : [],
                },
                network: TokenConst.NETWORK.BSC,
            })
            .select('address')
            .lean()

        if (addressesList.length > 0) {
            addressesList = addressesList.map((a) => a && a.address)
            transactionData = transactionData.filter((tx) => tx && addressesList.includes(tx.to))

            await Promise.map(
                transactionData,
                async (transaction) => {
                    try {
                        console.log('\t [BscService] Add deposit pending job: ', transaction.to)
                        await Queue.add(QUEUE_NAME.BSC_DEPOSIT_QUEUE, transaction)
                    } catch (error) {
                        console.log(error)
                    }
                },
                {concurrency: 2},
            )
        }

        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = async () => {
    let blockStart = 19000000
    let delayBlockNumber = 6
    let limit = 28800 // blocks ~ 1day
    const stepLimit = 500 // blocks ~ 25min
    let web3 = null
    try {
        //console.log('*************************************************************')
        //console.log('\tProcess Binance scan transactions at ' + new Date().toISOString())

        transactionData = []

        let binanceScanConfig = await model.SystemSetting.findOne({
            key: 'SCAN_BSC',
        })
        if (!binanceScanConfig) {
            // init with default value
            binanceScanConfig = await model.SystemSetting.createOne({
                key: 'SCAN_BSC',
                value: {
                    limit,
                    block: blockStart,
                    confirmation: delayBlockNumber,
                },
            })
        }

        blockStart = Number(binanceScanConfig.value.block)
        delayBlockNumber = Number(binanceScanConfig.value.confirmation)
        limit = Number(binanceScanConfig.value.limit)

        web3 = getWeb3()
        const currentBlockNumber = await web3.eth.getBlockNumber()
        console.log(`[BscService] current block number is `, currentBlockNumber)
        let blockEnd = currentBlockNumber - delayBlockNumber
        let blockLength = blockEnd - blockStart

        if (blockLength <= 0) {
            console.log(`[BscService] not enough block to scan current:${currentBlockNumber} - start:${blockStart}`)
            return
        } else {
            if (blockLength > limit) {
                console.log(`[BscService] bypass block from:${blockStart} to:${blockEnd - limit}`)
                blockStart = blockEnd - limit
                blockLength = limit
            }
            if (blockLength > stepLimit) {
                console.log(`[BscService] reduce block number`)
                blockEnd = blockStart + stepLimit
                blockLength = stepLimit
            }
        }

        //console.log({blockEnd, blockLength, blockStart})
        const queueData = Array.from({length: blockLength}, (_, index) => Number(index) + Number(blockStart))

        for (const token of SUPPORTED_SCAN_TOKEN) {
            const web3 = getWeb3()
            try {
                await processEventBlock(web3.eth, queueData, token)
            } catch (err) {
                console.error(err.message)
                if (err.message.includes('504 Gateway Time-out') || err.message.includes('502 Bad Gateway')) {
                    delistWeb3(web3.name)
                }
                throw err
            }
        }

        const queued = await _processData(transactionData, blockEnd)

        if (queued) {
            //update block scan
            await model.SystemSetting.findOneAndUpdate(
                {key: 'SCAN_BSC'},
                {
                    'value.block': blockEnd,
                },
            )
            console.log(`[BscService] Updated next block scan ${blockEnd}`)
        }
    } catch (e) {
        if (e.message.includes('504 Gateway Time-out') || 
            e.message.includes('502 Bad Gateway') || 
            e.message.includes('503 Service Temporarily Unavailable') ) {
            delistWeb3(web3.name)
        }
        console.error(`[BscService] exception:`, e)
        // logger.info({ message: e.message }, { service: 'transaction-success-scanning', phase: 'scan-failed', timestamp: new Date() })
    }
}
