const BaseModel = require('./base.model')

class Offer extends BaseModel {
    constructor(models) {
        super(models.Offer)
        this.models = models
    }
}

module.exports = Offer
