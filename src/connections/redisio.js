const RedisConnect = require('ioredis')

module.exports = class RedisIOClient {
    static getInstance() {
        if (!RedisIOClient.instance) {
        RedisIOClient.instance = new RedisIOClient()
        }

        return RedisIOClient.instance
    }
 
    _addEvent(client) {
        client.on('connect', () => {
        console.log('[Redis] connection connected.')
        })

        client.on("disconnected", () => {
        console.error(`[Redis] connection disconnected.`)
        })

        client.on("end", () => {
        console.error(`[Redis] connection ended.`)
        })

        client.on('error', err => {
        console.error('[Redis] connection got error.', err)
        })
    }

    constructor() {
        const host = process.env[`${process.env.MODE}_REDIS_HOST`]
        const port = process.env[`${process.env.MODE}_REDIS_PORT`]
        const db = process.env[`${process.env.MODE}_REDIS_DB`] ? process.env[`${process.env.MODE}_REDIS_DB`] : 1
        const url = `redis://${host}:${port}/${db}`
        
        this.redisClient = new RedisConnect(url)

        this._addEvent(this.redisClient)
        console.log(`New redis io client: ${url}`)

    }

    async connect() {
        if (this.REDIS_ENABLE) {
        await this.redisClient.connect();
        }
    }

    getConnection() {
        return this.redisClient
    }
}
