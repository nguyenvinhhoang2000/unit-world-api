const BaseModel = require('./base.model')

class WalletHistory extends BaseModel {
    constructor(models) {
        super(models.WalletHistory)
        this.models = models
    }
}

module.exports = WalletHistory
