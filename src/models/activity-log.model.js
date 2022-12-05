const BaseModel = require('./base.model')

class ActivityLog extends BaseModel {
    constructor(models) {
        super(models.ActivityLog)
        this.models = models
    }
}

module.exports = ActivityLog
