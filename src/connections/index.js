const Redis = require('./redis')
const Rabbit = require('./rabbit')

module.exports = class ConnectionRepository {
    constructor(opt) {
        this.Redis = Redis.getInstance()
        this.Rabbit = Rabbit.getInstance()
    }
}
