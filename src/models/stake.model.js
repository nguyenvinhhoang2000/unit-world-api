const BaseModel = require('./base.model')

class Stake extends BaseModel {
    constructor(models) {
        super(models.Stake)
        this.models = models
    }
}

module.exports = Stake
