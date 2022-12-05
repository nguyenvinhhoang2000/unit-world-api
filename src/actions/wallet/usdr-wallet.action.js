const Utils = require('../../utils')
const CONSTANTS = require('../../constants')
const Wallet = require('./_wallet')

class UsdrWallet extends Wallet {
    constructor(opts) {
        super(opts, 'token')
        this.currency = CONSTANTS.EntityConst.TRANSACTION.CURRENCY.TOKEN
    }
}

module.exports = UsdrWallet
