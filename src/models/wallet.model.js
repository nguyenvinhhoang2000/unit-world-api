const BaseModel = require('./base.model')

class Wallet extends BaseModel {
    constructor(models) {
        super(models.Wallet)
        this.models = models
    }
}

module.exports = Wallet
