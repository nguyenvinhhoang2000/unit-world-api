const BaseModel = require('./base.model')

class BankDeposit extends BaseModel {
    constructor(models) {
        super(models.BankDeposit)
        this.models = models
    }
}

module.exports = BankDeposit
