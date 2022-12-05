require("dotenv").config()
const { Sqs } = require('../../../utils')
const { Queue, EntityConst } = require('../../../constants');
const container = require('../../../configs/dependencies/container');
const model = container.resolve('model')

const MIN_BALANCE = 0.01

const { getBnbBalance } = require('../../web3/bsc/bsc')

let workers = [
    {
        privateKey: "0x2353bE06451a82D2044c9dca63294c538a2a6035",
        address: "cbd7d91b404519ac5796423411a32d4ce90c8aeef4e52fb3f77075019fa9ef5d",
        balance: 0,
        isAvailable: true
    },
    {
        privateKey: "0x577EAB5B02Ac2221531A3F99806a23027266C6E7",
        address: "6d178d1b8a45895ee0fd7fd2b23fb6fd5f06b9f25fe9a62d02d01fbc0784dc86",
        balance: 0,
        isAvailable: true
    }
]

const _checkBalanceBnb = async () => {
    try {
        await Promise.all(workers.map(async (ele, i) => {
            if (ele.isAvailable) {
                workers[i].balance = await getBnbBalance(ele.address)
            }
        }))
    } catch (error) {
        await sleep(3000)
        throw
    }
}

const _getWorkerFree = (qtyReq) => {
    try {
        for(let i = 0; i < workers.length; i++) {
            if(workers[i].isAvailable && balance > qtyReq + MIN_BALANCE){
                return [workers[i], i]
            }
        }
        return null


    } catch (error) {

    }
}


const _getWithdrawalRequest = async () => {
    try {

        let data = await Sqs.receiveTransaction(Queue.QUEUE_WITHDRAWAL)
        if (data && data.Messages && data.Messages.length > 0) {
            const receiptHandle = data.Messages[0].ReceiptHandle //for delete message
            let withdrawalRequest = JSON.parse(data.Messages[0].Body) //process transaction
            console.log(`withdrawalRequest = `, withdrawalRequest)
        }
        return null
    } catch (error) {
        console.log(error)
        return null
    }
}


const _processWithdrawalRequest = async (withdrawalRequest, i) => {
    try {

    } catch (error) {

    }

}

const _sendRequestToGameServer = async (data) => {
    try {
        console.log(`_sendRequestToGameServer`, data)
        let tmp = ApiServerGame.post('/withdrawal-request', { clientSecret: process.env[`${process.env.MODE}_GAME_SERVER_SECRET_KEY`], ...data })
        console.log(tmp.status)
    } catch (error) {
        console.log(error)
    }
}



const _deleteTransaction = async (receiptHandle) => {
    const data = await Sqs.deleteTransaction(Queue.QUEUE_WITHDRAWAL, receiptHandle)
    console.log(data)
}

const sleep = async (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}



const run = async () => {
    try {
        console.log(`=============== start exchange service =============`)


    } catch (error) {
        console.log(error)
        Telegram.sendNotifyToTelegram(`Claim service error`, error)
        await sleep(30000)
        run()
    }
}
run()
