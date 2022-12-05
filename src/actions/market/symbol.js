const Utils = require('../../utils')
const CONSTANTS = require('../../constants')
const {RestError} = require('../../utils')

class SymbolPair {
    constructor({market, pair, fee, limit}) {
        this.market = market
        this.name = pair
        this.asset = pair.split('/')[0]
        this.base = pair.split('/')[1]
        this.rate = rate.type == CONSTANTS.Market.RATE_TYPE.FIXED ? rate.value : undefined // lookup realtime
        this.takerFee = takerFee
        this.makerFee = makerFee
    }

    getFee = async (amount, type = CONSTANTS.Market.ROLE.TAKER) => {}

    getAsset = async (base) => {}

    getBase = async (asset) => {}
}

module.exports = SymbolPair
