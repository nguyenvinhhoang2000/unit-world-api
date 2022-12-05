const BaseModel = require('./base.model')

class Rank extends BaseModel {
    constructor(models) {
        super(models.Rank)
        this.models = models
    }
}

module.exports = Rank
