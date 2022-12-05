const BaseModel = require('./base.model')

class BankWithdraw extends BaseModel {
    constructor(models) {
        super(models.BankWithdraw)
        this.models = models
    }
}

module.exports = BankWithdraw
