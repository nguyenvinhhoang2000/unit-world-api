const BaseModel = require('./base.model')

class BankAccount extends BaseModel {
    constructor(models) {
        super(models.BankAccount)
        this.models = models
    }
}

module.exports = BankAccount
