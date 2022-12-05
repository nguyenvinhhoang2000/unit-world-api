const BaseModel = require('./base.model')

class ContactUs extends BaseModel {
    constructor(models) {
        super(models.ContactUs)
        this.models = models
    }
}

module.exports = ContactUs
