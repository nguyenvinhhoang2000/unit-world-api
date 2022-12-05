const BaseModel = require('./base.model')

class StakePackage extends BaseModel {
    constructor(models) {
        super(models.StakePackage)
        this.models = models
    }
}

module.exports = StakePackage
