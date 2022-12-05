const BaseModel = require('./base.model')

class BcWallet extends BaseModel {
    constructor(models) {
        super(models.BcWallet)
        this.models = models
    }
}

module.exports = BcWallet
