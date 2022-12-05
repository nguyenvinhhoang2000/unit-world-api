const BaseModel = require('./base.model')

class BountyCompletion extends BaseModel {
    constructor(models) {
        super(models.BountyCompletion)
        this.models = models
    }
}

module.exports = BountyCompletion
