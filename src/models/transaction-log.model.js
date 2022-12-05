const BaseModel = require('./base.model')

class TransactionLog extends BaseModel {
    constructor(models) {
        super(models.TransactionLog)
        this.models = models
    }
}

module.exports = TransactionLog
