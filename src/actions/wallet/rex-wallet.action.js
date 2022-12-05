const Utils = require('../../utils')
const CONSTANTS = require('../../constants')
const Wallet = require('./_wallet')

class RexWallet extends Wallet {
    constructor(opts) {
        super(opts, 'public_token')
        this.currency = CONSTANTS.EntityConst.TRANSACTION.CURRENCY.PUBLIC_TOKEN
    }
}

module.exports = RexWallet
