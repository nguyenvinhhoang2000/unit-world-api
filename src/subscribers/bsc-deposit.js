const Queue = require('../services/queue')
const {QUEUE_NAME} = require('../constants/job.constant')
const {processDeposit} = require('../services/web3/bsc/deposit/process-deposit.service')

module.exports = () => {
    console.log('Register Deposit Queue.', QUEUE_NAME.BSC_DEPOSIT_QUEUE)

    Queue.register(QUEUE_NAME.BSC_DEPOSIT_QUEUE, processDeposit)
}
