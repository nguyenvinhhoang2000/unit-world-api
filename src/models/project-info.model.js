const BaseModel = require('./base.model')

class ProjectInfo extends BaseModel {
    constructor(models) {
        super(models.ProjectInfo)
        this.models = models
    }
}

module.exports = ProjectInfo
