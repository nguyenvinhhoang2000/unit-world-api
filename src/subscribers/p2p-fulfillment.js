const Queue = require('../services/queue')
const {QUEUE_NAME} = require('../constants/job.constant')
const container = require('../configs/dependencies/container')
const model = container.resolve('model')
const action = container.resolve('action')
const CONSTANTS = require('../constants')
const { RestError } = require('../utils')

module.exports = () => {
    console.log('Register P2P FF Queue.')

    /* 
    Exchange stock vnd:
        - fulfill a sell order
            + precondition: stock is locked in offchain of seller
            + if vnd wallet has enough, charging buyer > [ send stock to buyer > confirmed > credit vnd to seller. If error, refund ]
            + if vnd wallet has not enough, update order to charging buyer > seller confirm > [ send stock to buyer > confirmed > credit vnd to seller. If error, refund ]
        - fulfill a buy order
            + precondition: vnd is locked from buyer
            + [ send stock to buyer > confirmed > credit vnd to seller. If error, refund ]
     */
    Queue.register(QUEUE_NAME.CONTRACT_EXCHANGE_STOCK_FIAT, async ({order_id}) => {
        try {
            const order = await model.Order.getModel().findOne({_id: order_id})
            .populate('orderbook').populate('project').populate('owner').lean()
            if (!order) {
                console.error(`Order of  ${order_id} not found`)
                return
            }

            if (order.status !== CONSTANTS.Market.ORDER_STATUS.PENDING) {
                throw RestError.NewNotAcceptableError(`Order ${order._id} wrong status`)
            }

            if(order.charging_method == 'built-in') {
                await action.ContractProject.exchangeStockVndBuiltInPayment(order)
            } else {
                await action.ContractProject.exchangeStockVndP2pPayment(order)
            }
        } catch (error) {
            await model.Order.getModel().findOneAndUpdate(
                {_id: order_id, status: CONSTANTS.Market.ORDER_STATUS.PENDING},
                {status: CONSTANTS.Market.ORDER_STATUS.FAILED, msg: error.message},
            )
            console.log(error.message)
            throw error
        }
    })


    Queue.register(QUEUE_NAME.CONTRACT_EXCHANGE_STOCK_USDR, async ({order_id}) => {
        try {
            const order = await model.Order.getModel().findOne({_id: order_id})
            .populate('orderbook').populate('project').lean()
            if (!order) {
                console.error(`Order of  ${order_id} not found`)
                return
            }

            if (order.status !== CONSTANTS.Market.ORDER_STATUS.PENDING) {
                throw RestError.NewNotAcceptableError(`Order ${order._id} wrong status`)
            }

            await action.ContractProject.exchangeStockUsdr(order)
        } catch (error) {
            await model.Order.getModel().findOneAndUpdate(
                {_id: order_id, status: CONSTANTS.Market.ORDER_STATUS.PENDING},
                {
                    status: CONSTANTS.Market.ORDER_STATUS.FAILED, 
                    msg: error.message
                },
            )
            console.log(error.message)
            throw error
        }
    })
}
