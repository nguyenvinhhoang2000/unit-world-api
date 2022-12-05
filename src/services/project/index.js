require('dotenv').config()
const { getEnv } = require('../../utils/getEnv.util')
const {getWeb3} = require('../web3/index')

// const Web3 = require('web3');
// const web3 = new Web3('https://data-seed-prebsc-1-s2.binance.org:8545/')

const REX_TOKEN_CONTRACT = getEnv('REX_TOKEN')

const RexProjectContract = () => {
    const web3 = getWeb3()
    let abi = require('./contracts/project/RexProjectContract.json')
    let rexContract = process.env[`${process.env.MODE}_REX_CONTRACT`]
    return new web3.eth.Contract(abi, rexContract)
}

const UsdrTokenContract = () => {
    const web3 = getWeb3()
    let abi = require('./contracts/bre/BREToken.json').abi
    let usdrTokenContract = process.env[`${process.env.MODE}_USDR`]
    return new web3.eth.Contract(abi, usdrTokenContract)
}

const RexTokenContract = () => {
    const web3 = getWeb3()
    let abi = require('./contracts/rex/REX.json')
    let rexTokenContract = REX_TOKEN_CONTRACT
    return new web3.eth.Contract(abi, rexTokenContract)
}

module.exports = {
    RexProjectContract: RexProjectContract(),
    UsdrTokenContract: UsdrTokenContract(),
    RexTokenContract: RexTokenContract()
}
