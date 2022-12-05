const BaseModel = require('./base.model')

class Referral extends BaseModel {
    constructor(models) {
        super(models.Referral)
        this.models = models
    }
}

module.exports = Referral
