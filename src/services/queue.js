const Bull = require('bull')
const {QUEUE_NAME, SCHEDULE_NAME} = require('../constants/job.constant')
const { locker } = require('./locker')

const QueueParams = {
    [QUEUE_NAME.BSC_DEPOSIT_QUEUE]: {
        attempts: 1,
        timeout: 1000 * 60 * 30, // 30min
        backoff: 60 * 1000,
    },
    [SCHEDULE_NAME.SYNC_PROJECT]: {
        //delay: 15000,
        attempts: 0,
        timeout: 1000 * 60, // 1min
        backoff: 60 * 1000,
        removeOnComplete: true,
        removeOnFail: true
    },
}

class Queue {
    static instances = {}
    static _PREFIX = 'queue'

    constructor({name, timeout, attempts, backoff}) {
        const host = process.env[`${process.env.MODE}_REDIS_HOST`]
        const port = process.env[`${process.env.MODE}_REDIS_PORT`]
        this.redisURI = `redis://${host}:${port}/1`
        this.name = name
        this.timeout = timeout
        this.attempts = attempts
        this.backoff = backoff

        const fname = `${Queue._PREFIX}:${name}`
        this.queue = new Bull(fname, this.redisURI, {
            attempts: attempts,
            timeout: timeout,
            backoff: backoff,
            //priority: 1
        })
    }

    static _formatQueueName = (name) => {
        if (!name || !(typeof name === 'string' || name instanceof String)) {
            throw new Error('Queue name is in valid')
        }
        return `${Queue._PREFIX}:${name}`
    }

    static get = (name) => {
        if (![...Object.values(QUEUE_NAME), ...Object.values(SCHEDULE_NAME)].includes(name)) {
            throw new Error(`[Queue] name ${name} does not exist`)
        }

        if (!Queue.instances[name]) {
            const config = QueueParams[name] ? QueueParams[name] : {}
            Queue.instances[name] = new Queue(Object.assign(config, {name}))
        }
        return Queue.instances[name]
    }

    static add = async (name, job) => {
        return Queue.get(name)._add(job)
    }

    static trigger = async (name, data={}) => {
        const jobs = await Queue.get(name).getJobs()
        console.log(jobs)
        if(jobs && jobs.length == 0) {
            console.log(`[Queue] --- schedule job trigger --- ${name}`, data)
            Queue.get(name)._add({
                seedTime: Date.now(),
                trigger:true,
                ...data
            }, { delay: 20000 })
        }
    }

    static register = async (name, asyncCb) => {
        return Queue.get(name)._register(asyncCb)
    }

    _add = async (job, opts={}) => {
        return this.queue.add(job, opts)
    }

    pause = async () => {
        return this.queue.pause()
    }

    isPaused = async () => {
        return this.queue.isPaused()
    }

    resume = async () => {
        return this.queue.resume()
    }

    _register = async (asyncCb) => {
        this.queue.process(async function (job) {
            console.log(`[Queue][${this.name}] start process..  ${new Date().toISOString()}`)


            const lockerKey = `job:${this.name}`
            const lockerTTL = 30000 // 30 seconds
            let lock = await locker.lock(lockerKey, lockerTTL)
            try {
                if (!job) {
                    console.log(`[Queue][${this.name}] Error: job is null`)
                    throw new Error('job null')
                }

                await asyncCb(job.data)
            } catch (error) {
                console.log(`[Queue][${this.name}] Error:`, error)
                throw error
            } finally {
                lock && lock.unlock().catch(e => {
                    console.error(`[Queue] unlock lock err: ${e.message}`)
                })
                console.log(`[Queue][${this.name}] processed. ${new Date().toISOString()}`)
                return Promise.resolve(true)
            }
        })
    }

    getJobs = async (type = ['waiting', 'active']) => {
        const jobs = await this.queue.getJobs(type)
        return jobs && jobs.map((d) => d.data)
    }

    flushQueue = async (type = ['waiting']) => {
        try {
            const jobs = await this.queue.getJobs(type)
            for (const job of jobs) {
                await job.remove()
            }
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports = Queue
