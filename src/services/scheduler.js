const Cron = require('node-cron')
const Queue = require('./queue')
const {locker} = require('./locker')
class Scheduler {
    constructor(overlap = false) {
        this.processing = {}
        this.overlap = overlap
    }

    shouldSkip(name) {
        if (this.overlap) return false

        return this.processing[name]
    }

    getprocessing() {
        return this.processing
    }

    schedule(name, crontab, handler) {
        Cron.schedule(crontab, async () => {
            //console.log('[Scheduler]  RUN_SCHEDULE:', crontab)
            console.log(`[Scheduler]  start ${name}:`, new Date().toISOString())

            // if (this.shouldSkip(name)) {
            //     console.log(`[Scheduler] Skip =>> ${name} is running.`)
            //     return
            // }
            // this.processing[name] = true

            const lockerKey = `job:${name}`
            const lockerTTL = 30000 // 30 seconds
            let lock = await locker.lock(lockerKey, lockerTTL)

            try {
                await handler()
            } catch (e) {
                console.log(`[Scheduler] Error:`, e)
            } finally {
                console.log(`[Scheduler]  end: ${name}`, new Date().toISOString())
                // this.processing[name] = false

                lock && lock.unlock().catch(e => {
                    console.error(`[Scheduler] unlock lock err: ${e.message}`)
                })
            }
        })
    }

    scheduleSeed(name, crontab) {
        Cron.schedule(crontab, async () => {
            console.log(`[Scheduler] ${name} Add job ${new Date().toISOString()}`, crontab)
            Queue.add(name, {seedTime: Date.now()})
        })
    }
}

module.exports = Scheduler
