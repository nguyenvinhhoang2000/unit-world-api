const BaseModel = require('./base.model')

class Transaction extends BaseModel {
    constructor(models) {
        super(models.Transaction)
        this.models = models
    }
}

module.exports = Transaction
