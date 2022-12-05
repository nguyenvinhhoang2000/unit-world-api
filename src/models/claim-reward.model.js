const BaseModel = require('./base.model')

class ClaimReward extends BaseModel {
    constructor(models) {
        super(models.ClaimReward)
        this.models = models
    }
}

module.exports = ClaimReward
