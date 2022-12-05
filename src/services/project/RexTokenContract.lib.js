const {RexTokenContract} = require('./index')
const Web3 = require('web3')
const {getWeb3} = require('../web3/index')
const { getEnv } = require('../../utils/getEnv.util')
const REX_TOKEN_CONTRACT = getEnv('REX_TOKEN')
const OWNER_ADDRESS = process.env[`${process.env.MODE}_OWNER_ADDRESS`]
const OWNER_PRIVATE_KEY = process.env[`${process.env.MODE}_OWNER_PRIVATE_KEY`]

class RexTokenLib {
    constructor() {
        this.callFuncAbiMethod = async (method, privateKey = OWNER_PRIVATE_KEY, from = OWNER_ADDRESS) => {
            try {
                const web3 = getWeb3()
                let gasPrice = await web3.eth.getGasPrice()

                let txData = method.encodeABI()
                let estimateGas = await web3.eth.estimateGas({
                    from: from,
                    to: REX_TOKEN_CONTRACT,
                    data: txData,
                })
                let tx = {
                    to: REX_TOKEN_CONTRACT,
                    value: 0,
                    gas: estimateGas,
                    gasPrice: gasPrice,
                    data: txData,
                }

                console.log(tx)
                const signed = await web3.eth.accounts.signTransaction(tx, privateKey)
                console.log(`signed`)
                const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction)

                return receipt
            } catch (error) {
                throw error
            }
        }
    }

    getTransactionLogs = async (txHash, eventName, filter = {}) => {
        // Get transaction details
        const trans = await getWeb3().eth.getTransaction(txHash)
        console.log({trans})
        if (!trans || !trans.input) {
            throw new Error(`Transaction ${txHash} is null`)
        }

        const logs = await RexTokenContract.getPastEvents(eventName, {
            filter,
            fromBlock: trans.blockNumber,
            toBlock: trans.blockNumber
        })

        return logs.find(l => l.transactionHash === txHash)
    }

    //permission: owner
    mintTo = async ({toAddress, amount}) => {
        try {
            console.log(`[TokenRexContract] Issue ${toAddress} amount ${amount} call from ${OWNER_ADDRESS}`)
            let method = await RexTokenContract.methods.mintTo(amount, toAddress)
            return await this.callFuncAbiMethod(method, OWNER_PRIVATE_KEY, OWNER_ADDRESS)
        } catch (error) {
            throw error
        }
    }

    // //permission: owner
    transfer = async ({recipient, amount, privateKey = OWNER_PRIVATE_KEY, address = OWNER_ADDRESS}) => {
        try {
            let method = await RexTokenContract.methods.transfer(recipient, amount)
            return await this.callFuncAbiMethod(method, privateKey, address)
        } catch (error) {
            throw error
        }
    }

    approve = async ({spender, amount, privateKey}) => {
        try {
            console.log(`[TokenRexContract] approve ${spender} ${amount}`)
            let method = await RexTokenContract.methods.approve(spender, amount)
            return await this.callFuncAbiMethod(method, privateKey, spender)
        } catch (error) {
            throw error
        }
    }
}

const rexTokenLib = new RexTokenLib()
exports.RexTokenLib = rexTokenLib
