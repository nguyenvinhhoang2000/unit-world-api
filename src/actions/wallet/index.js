const UsdrWallet = require('./usdr-wallet.action')
const RexWallet = require('./rex-wallet.action')
const VndWallet = require('./vnd-wallet.action')
const UsdtWallet = require('./usdt-wallet.action')
const StockWallet = require('./stock-wallet.action')

class WalletAction {
    static instance

    static getInstance(context) {
        if (!WalletAction.instance) {
            WalletAction.instance = new WalletAction(context)
        }

        return WalletAction.instance
    }
    constructor(context) {
        this.rexw = new RexWallet(context)
        this.usdrw = new UsdrWallet(context)
        this.vndw = new VndWallet(context)
        this.usdtw = new UsdtWallet(context)
        this.stockw = new StockWallet(context)
    }
}

module.exports = WalletAction
