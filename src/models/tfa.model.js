const BaseModel = require('./base.model')
const speakeasy = require('speakeasy')

class Tfa extends BaseModel {
    constructor(models) {
        super(models.Tfa)
        this.models = models
    }
}

module.exports = Tfa
