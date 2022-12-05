const Redlock = require('redlock')
const RedisIOClient = require('../connections/redisio')
const redis = RedisIOClient.getInstance()

const LockerStatus = {
  released: 'released',
  locked: 'locked',
}

class Locker {
  constructor(opts={}) {
    const {prefix, defaultTtl} = Object.assign({
      prefix: `locker:${process.env.NODE_ENV}`,
      defaultTtl: 15000
    }, opts)

    this.client = redis
    this.prefix = prefix || `locker:${process.env.NODE_ENV}`
    this.defaultTtl = defaultTtl

    this.redlock = new Redlock([redis.getConnection()], {
      driftFactor: 0.01,
      retryCount: 5,
      retryDelay: 3000,
      retryJitter: 500,
    })

    this.redlock.on("clientError", (error) => {
      console.error(error.message);
    });

  }

  _getKey(resource) {
    return `${this.prefix}:${resource}`
  }

  async getStatus(resource) {
    const key = this._getKey(resource)
    const exist = await this.client.getConnection().exists(key)

    return exist ? LockerStatus.locked : LockerStatus.released
  }

  async lock(resource, ttl) {
    if (!this.client || !this.redlock) {
      console.log(`[Locker] redis was not ready`)
      return undefined
    }

    const key = this._getKey(resource)
    if (!ttl) {
      ttl = this.defaultTtl
    }

    try {
      const lock = await this.redlock.lock(key, ttl)
      console.log(`[Locker] lock resource ${key} ttl=${ttl}`)
      return lock
    } catch (error) {
      console.log("[Locker] got error:", error)

      throw error
    }
  }
}

exports.locker = new Locker()


// setTimeout(async () => {
//   const locker = new Locker(redis)

//   const lockerTTL = 6000

//   const action = async (index, lockerKey) => {
//     let lock = await locker.lock(lockerKey, lockerTTL)
//     try {
//       console.log(`aquired:${lockerKey}-${index}`)
//       await new Promise(r => setTimeout(r, 1000));
//     } catch (error) {
//       console.log(error.message)
//     } finally {
//       lock && lock.unlock().catch(e => {
//         console.error(`unlock lock order err: ${e.message}`)
//       })
//       console.log(`released:${lockerKey}-${index}`)
//     }
//   }

//   for (let i = 0; i < 4; ++i) {
//     action(i, 'res1')
//     action(i, 'res2')
//   }
// }, 3000)
