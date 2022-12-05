const BaseModel = require('./base.model')

class Stock extends BaseModel {
    constructor(models) {
        super(models.Stock)
        this.models = models
    }
}

module.exports = Stock
