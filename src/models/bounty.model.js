const BaseModel = require('./base.model')

class Bounty extends BaseModel {
    constructor(models) {
        super(models.Bounty)
        this.models = models
    }
}

module.exports = Bounty
