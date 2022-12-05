const P2pMarket = require('./p2p.market')
const SwapMarket = require('./swap.market')
const IDOMarket = require('./ido.market')

class MarketAction {
    static instance

    static getInstance(context) {
        if (!MarketAction.instance) {
            MarketAction.instance = new MarketAction(context)
        }
        return MarketAction.instance
    }
    constructor(context) {
        this.p2p = new P2pMarket(context)
        this.swap = new SwapMarket(context)
        this.ido = new IDOMarket(context)
    }
}

module.exports = MarketAction
