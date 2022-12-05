const Queue = require('../services/queue')
const {QUEUE_NAME} = require('../constants/job.constant')
const withdrawBscToken = require('../services/web3/bsc/withdraw/process-withdrawal-request.service')

module.exports = () => {
    console.log('Register Deposit Queue.')

    Queue.register(QUEUE_NAME.BSC_WITHDRAW_QUEUE, withdrawBscToken)
}
