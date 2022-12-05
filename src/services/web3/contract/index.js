const BreMarketAbi = require('./bre-market-contract.abi.json')
const BreTokenAbi = require('./bre-token.abi.json')
const UsdtTokenAbi = require('./usdt-bsc.abi.json')

const {getWeb3} = require('../index')

const constructTokenContract = (contractAddress, abi = UsdtTokenAbi) => {
    let web3 = getWeb3()
    return new web3.eth.Contract(abi, contractAddress)
}

class Contract {
    static instance

    static getInstance() {
        if (!Contract.instance) {
            Contract.instance = new Contract()
        }

        return Contract.instance
    }

    constructor() {
        this.constructTokenContract = constructTokenContract
        this.BreMarket = constructTokenContract(process.env[`${process.env.MODE}_REX_CONTRACT`], BreMarketAbi)
        this.BreToken = constructTokenContract(process.env[`${process.env.MODE}_USDR`], BreTokenAbi)
        this.UsdtToken = constructTokenContract(process.env[`${process.env.MODE}_USDT_TOKEN`], UsdtTokenAbi)
    }
}

module.exports = Contract.getInstance()
