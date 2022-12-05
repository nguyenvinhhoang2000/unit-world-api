require('dotenv').config()
const container = require('../../../../configs/dependencies/container')
const model = container.resolve('model')

const BscUtils = require('../../../../services/blockchain/bsc/bsc')

const CryptoUtils = require('../../../../utils/encrypt.util')

const CONSTANTS = require('../../../../constants')

const KEY_ENCRYPTION = process.env[`${process.env.MODE}_KEY_ENCRYPTION`]
const MIN_USDT_WITHDRAW = 2
const FEE_BSC = 0.001

const processCollection = async () => {
    try {
        let money = await model.Transaction.findOne(
            {
                type: CONSTANTS.Entity.TRANSACTION.TYPE.DEPOSIT,
                isCollected: {
                    $in: [false, null, undefined],
                },
                gateway: CONSTANTS.Entity.TRANSACTION.GATEWAY.BSC,
                currency: CONSTANTS.Entity.TRANSACTION.CURRENCY.USDT,
            },
            {},
            'account',
        )
        // await repository.money.updateMoney({ address: money.address }, { active: true })
        // console.log(`money = `, money)
        if (!money || !money.to) {
            await sleep(3000)
            return
        }
        //kiem tra balance
        let balanceUsdt = await BscUtils.getBscTokenBalance(
            process.env[`${process.env.MODE}_USDT_BSC_CONTRACT`],
            money.to,
        )
        if (balanceUsdt < MIN_USDT_WITHDRAW) {
            await model.Transaction.findOneAndUpdate({_id: money._id}, {isCollected: true})
            console.log(`Balance of address ${money.to} = ${Number(balanceUsdt)} < ${MIN_USDT_WITHDRAW}`)
            return
        }

        let balanceBnb = await BscUtils.getBnbBalance(money.to)
        console.log(`balanceBnb =`, balanceBnb)

        if (balanceBnb == undefined || balanceBnb < FEE_BSC) {
            console.log(`here`)
            //chuyen bnb vao
            let result = await BscUtils.createBscBnbTransfer(money.to, FEE_BSC)
            if (result.status != true) {
                console.log(`Can't transfer BSC fee to ${money.to}`)
                await sleep(3000)
                return
            }
            await sleep(5000)
        }
        // return
        let address = await model.Address.findOne({address: money.to})
        //rut usdt ra
        let privateKey = CryptoUtils.decrypt(KEY_ENCRYPTION, address.privateKey)
        // console.log(`privateKey = `, privateKey)
        let response = await BscUtils.createBscTransferToken(
            process.env[`${process.env.MODE}_USDT_BSC_CONTRACT`],
            process.env[`${process.env.MODE}_BSC_ACCOUNT_COLLECTION_ADDRESS`],
            balanceUsdt,
            privateKey,
            address.address,
        )

        // console.log(response)
        if (!response) {
            console.log(`Can't collect USDT from ${money.to}`)
            return
        }

        // return
        await model.Transaction.findOneAndUpdate({_id: money._id}, {isCollected: true})

        return
    } catch (error) {
        console.log(error)
        await sleep(30000)
    }
}

async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

const run = async () => {
    try {
        // console.log(`=========== start service =======`)
        await processCollection()
        await run()
    } catch (error) {
        console.log(error)
    }
}

run()
