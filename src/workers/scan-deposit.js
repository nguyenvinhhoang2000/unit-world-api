const Scheduler = require('../services/scheduler')
const {SCHEDULE_NAME, CRON_JOB} = require('../constants/job.constant')
const BscDepositScanJob = require('../services/web3/bsc/deposit/cronb-usdt-bsc-blockchain.service')

module.exports = () => {
    console.log('Register cron jobs.')
    const scheduler = new Scheduler()

    scheduler.schedule(SCHEDULE_NAME.SCAN_DEPOSIT_BSC, CRON_JOB.EVERY_TWO_MINUTES_15, BscDepositScanJob)
}
