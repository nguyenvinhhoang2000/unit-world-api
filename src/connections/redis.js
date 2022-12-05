const {createClient} = require('redis')

module.exports = class RedisClient {
    static instance

    static getInstance() {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient()
        }

        return RedisClient.instance
    }

    _addEvent(client) {
        client.on('connect', () => {
            console.log('[Redis] connection connected.')
        })

        client.on('disconnected', () => {
            console.error(`[Redis] connection disconnected.`)
        })

        client.on('end', () => {
            console.error(`[Redis] connection ended.`)
        })

        client.on('error', (err) => {
            console.error('[Redis] connection got error.', err)
        })
    }

    constructor() {
        const host = process.env[`${process.env.MODE}_REDIS_HOST`]
        const port = process.env[`${process.env.MODE}_REDIS_PORT`]
        const db = process.env[`${process.env.MODE}_REDIS_DB`] ? process.env[`${process.env.MODE}_REDIS_DB`] : 1
        const url = `redis://${host}:${port}/${db}`
        this.redisClient = new createClient(url)
        this.redisClient.connect()

        this._addEvent(this.redisClient)
        console.log(`New redis client: ${url}`)
    }

    async connect() {
        await this.redisClient.connect()
    }

    getConnection() {
        return this.redisClient
    }
}
