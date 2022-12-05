const BaseModel = require('./base.model')

class Project extends BaseModel {
    constructor(models) {
        super(models.Project)
        this.models = models
    }
}

module.exports = Project
