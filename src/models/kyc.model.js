const BaseModel = require('./base.model')

class Kyc extends BaseModel {
    constructor(models) {
        super(models.Kyc)
        this.models = models
    }
}

module.exports = Kyc
