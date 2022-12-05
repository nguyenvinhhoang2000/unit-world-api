const BaseModel = require('./base.model')

class BankOrder extends BaseModel {
    constructor(models) {
        super(models.BankOrder)
        this.models = models
    }
}

module.exports = BankOrder
