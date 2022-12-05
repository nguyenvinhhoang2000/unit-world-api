const Utils = require('../../utils')
const CONSTANTS = require('../../constants')
const {Lang, EntityConst} = CONSTANTS
const {RestError} = require('../../utils')
const SymbolPair = require('./symbol')
const WalletAction = require('../wallet')
// const MarketInterface = {
//     fulfillOrder: () => {throw "must implement MarketInterface"},
//     placeLimitOrder: () =>  {throw "must implement MarketInterface"},
//   }

class Market {
    constructor(opts) {
        this.marketName = 'default'
        this.model = opts.model
        this.pairs = {}
        this.wallet = WalletAction.getInstance(opts)
        this.markets = {}
    }

    getMarket = async (market) => {
        if (this.markets[market]) return this.markets[market]

        const rst = await this.model.Market.getModel().findOne({market})

        if (!rst || !rst.pair || !rst.pair.asset || !rst.pair.base || !rst.active)
        throw RestError.NewNotAcceptableError('MARKET_CONFIG_INVALID', 400, [{market}])


        if (rst) this.markets[market] = rst
        return rst
    }

    getMarkets = async (market) => {
        if (this.markets[market]) return this.markets[market]

        const rst = await this.model.Market.getModel().find({market})
        if (rst) this.markets[market] = rst
        return rst
    }

    // init = async() => {
    //     const settings = await this.model.Market.getModel().find({market: this.marketName, active: true})
    //     settings.map(s => {
    //         this.pairs[s.pair] = new SymbolPair({
    //             market: s._id,
    //             pair: s.pair,
    //             fee: s.fee,
    //             limit: s.limit
    //         })
    //     })
    // }

    // fulfill+lock assets > execute contract > swap assets or unlock if fail
    fulfillOrder = async ({}) => {
        try {
            return null
        } catch (error) {
            throw error
        }
    }

    placeOrder = async ({}) => {
        try {
            return null
        } catch (error) {
            throw error
        }
    }

    getOrders = async (filter) => {
        try {
            return null
        } catch (error) {
            throw error
        }
    }

    getHistory = async (filter) => {
        try {
            return null
        } catch (error) {
            throw error
        }
    }
}

exports.Market = Market
