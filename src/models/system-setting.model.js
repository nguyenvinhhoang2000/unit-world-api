const BaseModel = require('./base.model')

class SystemSetting extends BaseModel {
    constructor(models) {
        super(models.SystemSetting)
        this.models = models
    }
}

module.exports = SystemSetting
