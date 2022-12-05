const BaseModel = require('./base.model')

class StakeAction extends BaseModel {
    constructor(models) {
        super(models.StakeAction)
        this.models = models
    }
}

module.exports = StakeAction
