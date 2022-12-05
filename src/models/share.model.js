const BaseModel = require('./base.model')

class Share extends BaseModel {
    constructor(models) {
        super(models.Share)
        this.models = models
    }
}

module.exports = Share
