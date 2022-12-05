const BaseModel = require('./base.model')

class Address extends BaseModel {
    constructor(models) {
        super(models.Address)
        this.models = models
    }
}

module.exports = Address
