const BaseModel = require('./base.model')

class Vote extends BaseModel {
    constructor(models) {
        super(models.Vote)
        this.models = models
    }
}

module.exports = Vote
