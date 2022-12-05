const BaseModel = require('./base.model')

class Exchange extends BaseModel {
    constructor(models) {
        super(models.Exchange)
        this.models = models
    }
}

module.exports = Exchange
