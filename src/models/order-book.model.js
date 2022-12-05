const BaseModel = require('./base.model')

class OrderBook extends BaseModel {
    constructor(models) {
        super(models.OrderBook)
        this.models = models
    }
}

module.exports = OrderBook
