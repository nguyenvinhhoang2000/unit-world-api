const Web3 = require('web3')
require('dotenv').config()
const {Math} = require('../../utils')

const binanceProvider = {
    MAINNET: {
        p1: new Web3('https://bsc-dataseed.binance.org/'),
        p2: new Web3('https://bsc-dataseed1.defibit.io/'),
        p3: new Web3('https://bsc-dataseed1.ninicoin.io/'),
    },
    TESTNET: {
        // p1: new Web3('https://data-seed-prebsc-1-s1.binance.org:8545/'),
        // p2: new Web3('https://data-seed-prebsc-2-s1.binance.org:8545/'),
        // p3: new Web3('https://data-seed-prebsc-1-s2.binance.org:8545/'),
        // p4: new Web3('https://data-seed-prebsc-2-s2.binance.org:8545/'),
        p5: new Web3('https://data-seed-prebsc-1-s3.binance.org:8545/'),
        // p6: new Web3('https://data-seed-prebsc-2-s3.binance.org:8545/'),
        // p7: new Web3('https://speedy-nodes-nyc.moralis.io/ac90bbe86b34739f074bffc6/bsc/testnet')
    },
}

let blackList = {}

exports.delistWeb3 = (name) => {
    console.log(`[Web3] Delist ${name}`)
    if (!Object.keys(binanceProvider[process.env.MODE]).includes(name)) return
    blackList[name] = true
}

exports.getWeb3 = () => {
    let names = Object.keys(binanceProvider[process.env.MODE]).filter((name) => !blackList[name])
    console.log(`[web3]`, {names})
    if(names.length === 0) {
        blackList = {}
        names = Object.keys(binanceProvider[process.env.MODE])
    }
    const index = Math.randomInt(names.length)
    binanceProvider[process.env.MODE][names[index]]['name'] = names[index]
    return binanceProvider[process.env.MODE][names[index]]
}
exports.listWeb3 = () => {
    const names = Object.keys(binanceProvider[process.env.MODE]).filter((name) => !blackList[name])
    const availableList = names.map((n) => {
        binanceProvider[process.env.MODE][n]['name'] = n
        return binanceProvider[process.env.MODE][n]
    })
    return availableList
}
