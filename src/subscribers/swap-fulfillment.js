const Queue = require('../services/queue')
const {QUEUE_NAME} = require('../constants/job.constant')
const CONSTANTS = require('../constants')
const {ContractTokenLib} = require('../services/project/UsdrTokenContract.lib')
const container = require('../configs/dependencies/container')
const model = container.resolve('model')
const action = container.resolve('action')

module.exports = () => {
    console.log('Register swap FF job.')

    Queue.register(QUEUE_NAME.CONTRACT_SWAP_TOKEN, async ({order_id}) => {
        try {
            const order = await model.Order.getModel().findOne({_id: order_id}).lean()
            if (!order) {
                console.error(`Order of  ${order_id} not found`)
                return
            }

            if (order.status != CONSTANTS.Market.ORDER_STATUS.PENDING) {
                console.error(`Order ${order_id} invalid`)
                return
            }

            if (order.type === CONSTANTS.Market.ORDER.BUY) await action.ContractUsdr.buyToken(order)
            else await action.ContractUsdr.sellToken(order)
        } catch (error) {
            await model.Order.getModel().findOneAndUpdate(
                {_id: order_id, status: CONSTANTS.Market.ORDER_STATUS.PENDING},
                {status: CONSTANTS.Market.ORDER_STATUS.FAILED, msg: error.message},
            )
            console.log(error.message)
        }
    })
}
