const BaseModel = require('./base.model')

class User extends BaseModel {
    constructor(models) {
        super(models.User)
        this.models = models
    }
}

module.exports = User
