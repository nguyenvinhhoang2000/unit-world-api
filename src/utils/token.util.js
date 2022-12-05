const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const fs = require('fs')
const CONSTANTS = require('../constants')
const privateKEY = fs.readFileSync(`./src/keys/private-${process.env.MODE}.key`, 'utf8')
const ethers = require('ethers')
const Web3 = require('web3'); // eslint-disable-line
const web3 = new Web3(); // eslint-disable-line

function createRefreshToken(user_id) {
    const timeCreate = new Date().getTime()
    const data = user_id + timeCreate

    const value = crypto.createHash(CONSTANTS.UtilsConst.ENCRYPT.HASH_ALGORITHMS).update(data).digest('base64')

    //return refresh token
    return value
}

function createAccessToken(user_id) {
    var signOptions = {
        expiresIn: CONSTANTS.UtilsConst.JWT_TOKEN_DURATION, // 10 minute validity
        algorithm: CONSTANTS.UtilsConst.ENCRYPT_ALGORITHMS,
    }
    let expired_time = new Date().getTime() + CONSTANTS.UtilsConst.JWT_TOKEN_DURATION * 1000
    var access_token = jwt.sign({user_id: user_id, expired_time: expired_time}, privateKEY, signOptions)

    return {access_token, expired_time}
}

async function getPublicTokenRate() {
    return 1 // TODO: get rate from external exchange
}

function normalizeTokenAmount(amount, decimal) {
    return ethers.utils.parseUnits(amount.toString(), decimal?decimal:18)
}

function weiToEther(amount) {
    let eth = web3.utils.fromWei(amount, 'ether');

    return eth
}

module.exports = {
    createRefreshToken,
    createAccessToken,
    getPublicTokenRate,
    normalizeTokenAmount,
    weiToEther
}
