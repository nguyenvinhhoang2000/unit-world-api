require('dotenv').config()
const { Sqs, Telegram } = require('../../../utils')
const { Queue, EntityConst, Token } = require('../../../constants')
const container = require('../../../configs/dependencies/container')
const model = container.resolve('model')
const {getBnbBalance, createBscBnbTransfer} = require('../../web3/bsc/bsc')

const MIN_CLAIM_BALANCES = 0.01

const CLAIMS_ADDRESS = [
    process.env[`${process.env.MODE}_CLAIMER_ADDRESS_1`],
    process.env[`${process.env.MODE}_CLAIMER_ADDRESS_2`],
    process.env[`${process.env.MODE}_CLAIMER_ADDRESS_3`],
    process.env[`${process.env.MODE}_CLAIMER_ADDRESS_4`],
    process.env[`${process.env.MODE}_CLAIMER_ADDRESS_5`],
]
const CLAIMS_PRIVATE_KEY = [
    process.env[`${process.env.MODE}_CLAIMER_PRIVATE_KEY_1`],
    process.env[`${process.env.MODE}_CLAIMER_PRIVATE_KEY_2`],
    process.env[`${process.env.MODE}_CLAIMER_PRIVATE_KEY_3`],
    process.env[`${process.env.MODE}_CLAIMER_PRIVATE_KEY_4`],
    process.env[`${process.env.MODE}_CLAIMER_PRIVATE_KEY_5`],
]
let claimerStatus = [true, true, true, true, true]
let checkStatusNext = [true, true, true, true, true]
let checkBalanceBnb = [true, true, true, true, true]
let bnbBalanceOfClaimer = []
let notiTeleBalances = []

const _getfeeReq = async () => {
    try {
        let data = await Sqs.receiveTransaction(Queue.FEE_POOL)
        if (data && data.Messages && data.Messages.length > 0) {
            const receiptHandle = data.Messages[0].ReceiptHandle //for delete message
            let getFeeReq = JSON.parse(data.Messages[0].Body) //process transaction
            console.log(`getFeeReq = `, getFeeReq)

            return { getFeeReq, receiptHandle }
        }
        return null
    } catch (error) {
        console.log(error)
        return null
    }
}

const _processfeeReq = async (getFeeReq, i) => {
    try {
        await createBscBnbTransfer(
            getFeeReq.to,
            getFeeReq.amount,
            CLAIMS_ADDRESS[i],
            CLAIMS_PRIVATE_KEY[i],
        )

        //updatebalance
        bnbBalanceOfClaimer[i] = await getBnbBalance(CLAIMS_ADDRESS[i])

        //update status
        claimerStatus[i] = true
        checkStatusNext[i] = true
        if (bnbBalanceOfClaimer[i] < MIN_CLAIM_BALANCES) {
            claimerStatus[i] = false

            // //send noti to tele
            // if (!notiTeleBalances[i]) {
            //     Telegram.sendNotifyToTelegram('Claimer no fee', `${CLAIMS_ADDRESS[i]} - ${bnbBalanceOfClaimer[i]}`)
            //     notiTeleBalances[i] = true
            // }
        } else {
            await sleep(3000)
            claimerStatus[i] = true
            // notiTeleBalances[i] = false
        }
        console.log(`[Claimer - ${i} - done - bnbBalance = ${bnbBalanceOfClaimer[i]}]`)
    } catch (error) {
        console.log(error)
    }
}


const _deleteTransaction = async (receiptHandle) => {
    const data = await Sqs.deleteTransaction(Queue.FEE_POOL, receiptHandle)
    console.log(data)
}

const sleep = async (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

const run = async () => {
    try {
        console.log(`=============== start exchange service =============`)

        //checkBalance claimer

        while (true) {
            for (let i = 0; i < CLAIMS_ADDRESS.length; i++) {
                bnbBalanceOfClaimer[i] = await getBnbBalance(CLAIMS_ADDRESS[i])
                console.log(
                    i,
                    'BNB:',
                    bnbBalanceOfClaimer[i],
                )

                if (bnbBalanceOfClaimer[i] < MIN_CLAIM_BALANCES) {
                    claimerStatus[i] = false
                    //send noti to tele
                    // if (!notiTeleBalances[i]) {
                    //     Telegram.sendNotifyToTelegram(
                    //         'Claimer no fee',
                    //         `${CLAIMS_ADDRESS[i]} - ${bnbBalanceOfClaimer[i]}`,
                    //     )
                    //     notiTeleBalances[i] = true
                    // }
                } else {
                    claimerStatus[i] = true
                    // notiTeleBalances[i] = false
                }


            }
            // console.log('here1')
            let count = 0
            let claimRequestTmp
            let processes = []
            //maybe stop

            if (
                checkStatusNext[0] &&
                checkStatusNext[1] &&
                checkStatusNext[2] &&
                checkStatusNext[3] &&
                checkStatusNext[4]
            ) {
                console.log(`\tMayBe safely pause in 5s:...\n`)
                await sleep(5000)
            }

            console.log(`Claimer 0: `, checkStatusNext[0] ? 'availabe' : 'busy', claimerStatus[0])
            console.log(`Claimer 1: `, checkStatusNext[1] ? 'availabe' : 'busy', claimerStatus[1])
            console.log(`Claimer 2: `, checkStatusNext[2] ? 'availabe' : 'busy', claimerStatus[2])
            console.log(`Claimer 3: `, checkStatusNext[3] ? 'availabe' : 'busy', claimerStatus[3])
            console.log(`Claimer 4: `, checkStatusNext[4] ? 'availabe' : 'busy', claimerStatus[4])

            for (let i = 0; i < CLAIMS_ADDRESS.length; i++) {
                // console.log('here2')
                // console.log(`checkBalanceSVE[${i}] = `,checkBalanceSVE[i])
                // console.log(`claimerStatus[${i}] = `,claimerStatus[i])
                // console.log(`checkStatusNext[${i}] = `,checkStatusNext[i])
                // console.log(`bnbBalanceOfClaimer[${i}] = `,bnbBalanceOfClaimer[i])
                // console.log(`checkBalanceSVE[${i}] && claimerStatus[${i}] && bnbBalanceOfClaimer[${i}] > ${MIN_CLAIM_BALANCES} `,checkBalanceSVE[i] && claimerStatus[i] && checkStatusNext[i] && bnbBalanceOfClaimer[i] > MIN_CLAIM_BALANCES)
                if (
                    claimerStatus[i] &&
                    checkStatusNext[i] &&
                    bnbBalanceOfClaimer[i] > MIN_CLAIM_BALANCES
                ) {
                    let req = await _getfeeReq()
                    // console.log('here3', req)

                    if (!req) {
                        break
                    }
                    let { getFeeReq, receiptHandle } = req

                    claimRequestTmp = getFeeReq

                    if (getFeeReq.amount <= bnbBalanceOfClaimer[i]) {
                        count++
                        claimerStatus[i] = false
                        checkStatusNext[i] = false
                        checkBalanceBnb[i] = true
                        await _deleteTransaction(receiptHandle)
                        await sleep(Math.round(Math.random() * 5000))
                        _processfeeReq(getFeeReq, i)
                    } else {
                        checkBalanceBnb[i] = false
                        // Telegram.sendNotifyToTelegram(
                        //     'Claimer not enough RSVE',
                        //     `${CLAIMS_ADDRESS[i]} - ${RSVEBalanceOfClaimer[i]} - Need: ${claimRequestTmp.amount}`,
                        // )
                    }
                }
                // }
            }

            // Promise.all(processes)

            if (count == 0) {
                if (
                    checkStatusNext[0] &&
                    checkStatusNext[1] &&
                    checkStatusNext[2] &&
                    checkStatusNext[3] &&
                    checkStatusNext[4]
                ) {
                    console.log(`\tAll no request\n`)
                } else {
                    console.log(`checkStatusNext = `, JSON.stringify(checkStatusNext))
                }

                await sleep(3000)
            } else {
                //
                console.log(`waiting 10s to completed trans`)
                await sleep(10000)
                console.log(`start next round`)
            }
        }
    } catch (error) {
        console.log(error)
        Telegram.sendNotifyToTelegram(`Claim service error`, error)
        await sleep(30000)
        run()
    }
}
run()
