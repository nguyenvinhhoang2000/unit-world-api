const BaseModel = require('./base.model')

class BankExchange extends BaseModel {
    constructor(models) {
        super(models.BankExchange)
        this.models = models
    }
}

module.exports = BankExchange
