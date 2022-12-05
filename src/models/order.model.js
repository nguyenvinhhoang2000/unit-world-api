const BaseModel = require('./base.model')

class Order extends BaseModel {
    constructor(models) {
        super(models.Order)
        this.models = models
    }
}

module.exports = Order
