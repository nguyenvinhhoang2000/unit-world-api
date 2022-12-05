const RedisClient = require('../connections/redis')
const redis = RedisClient.getInstance()

const _formatKey = (key) => {
    if (!key || !(typeof key === 'string' || key instanceof String)) {
        throw new Error('redis key error')
    }
    return `${CacheService.REDIS_PREFIX}:${key}`
}
class CacheService {
    static redisClient = redis.getConnection()
    static REDIS_PREFIX = 'redis:cache'
    static async connect() {
        return redis.connect()
    }

    static async set(key, value, expireTime = 0) {
        console.log(`[Cache] set ${key} = ${value} ex in ${expireTime} s`)
        await CacheService.redisClient.set(_formatKey(key), value, {EX: expireTime})
    }

    static async get(key) {
        return await CacheService.redisClient.get(_formatKey(key))
    }

    static async incr(key) {
        const existed = await CacheService.redisClient.exists(_formatKey(key))
        if (!existed) throw new Error('Redis key error', key)

        await CacheService.redisClient.incr(_formatKey(key))
    }

    static async decr(key) {
        const existed = await CacheService.redisClient.exists(_formatKey(key))
        if (!existed) throw new Error('Redis key error', key)

        await CacheService.redisClient.decr(_formatKey(key))
    }

    static async exists(key) {
        await CacheService.redisClient.exists(_formatKey(key))
    }

    static async hSet(hash, key, value, expireTime = 0) {
        return await CacheService.redisClient.hSet(_formatKey(hash), key, value, {EX: expireTime})
    }

    static async hGet(hash, key) {
        return await CacheService.redisClient.hGet(_formatKey(hash), key)
    }

    static async hGetAll(hash) {
        return await CacheService.redisClient.hGetAll(_formatKey(hash))
    }

    static async hDel(hash, key) {
        return await CacheService.redisClient.hDel(_formatKey(hash), key)
    }

    static async del(hash) {
        return await CacheService.redisClient.del(_formatKey(hash))
    }

    static async setObj(key, value, expireTime = 0) {
        await CacheService.redisClient.set(_formatKey(key), JSON.stringify(value), {EX: expireTime ? expireTime : 0})
    }

    static async getObj(key = '') {
        return JSON.parse(await CacheService.redisClient.get(_formatKey(key)))
    }

    static async del(key = '') {
        await CacheService.redisClient.del(_formatKey(key))
    }
}

exports.CacheService = CacheService
