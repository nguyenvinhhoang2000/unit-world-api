const BaseModel = require('./base.model')

class Market extends BaseModel {
    constructor(models) {
        super(models.Market)
        this.models = models
    }
}

module.exports = Market
