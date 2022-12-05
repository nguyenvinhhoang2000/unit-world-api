const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const Uuid = require('uuid').v4
const util = require('util')
//util
const Utils = require('../utils')
const CONSTANTS = require('../constants')
const {Lang, EntityConst} = CONSTANTS
const {RestError, ResponseFormat} = require('../utils')
const {mustKyc} = require('../middleware/kyc')
const BscService = require('../services/web3/bsc/bsc')
const {Tfa} = require('../utils')
const S3 = require('../utils/s3.util')
const Queue = require('../services/queue')
const {QUEUE_NAME} = require('../constants/job.constant')
const Email = require('../utils/email.util')
const { round } = require('lodash')
const { ROLES } = require('../middleware/role-authenticate')

class Market {
    constructor(opts) {
        this.model = opts.model
        this.action = opts.action
    }

    getOrders = async ({path, base, page = 1, limit = 20, status, query, order}) => {
        try {
            limit = Number(limit)
            const offset = (page - 1) * limit
            let data = null
            if (path.includes(CONSTANTS.Market.MARKET.IDO.toLowerCase())) {
                data = await this.action.Market.ido.getOrders({limit, page, status})
            } else if (path.includes(CONSTANTS.Market.MARKET.SWAP.toLowerCase())) {
                data = await this.action.Market.swap.getOrders({base, limit, page, status})
            } else if (path.includes(CONSTANTS.Market.MARKET.P2P.toLowerCase())) {
                data = await this.action.Market.p2p.getOrders({query, limit, page, order})
            }

            return ResponseFormat.formatResponse(200, 'OK', data)
        } catch (error) {
            throw error
        }
    }

    getHistory = async ({path, user, type, page = 1, limit = 20, status, query, order, asUser, date}) => {
        if (user.role !== ROLES.ADMIN) {
            asUser = undefined
        }

        try {
            let data = null

            if (path.includes(CONSTANTS.Market.MARKET.IDO.toLowerCase())) {
                data = await this.action.Market.ido.getHistory({userId: user._id, type, limit, page, status, asUser, date})
            } else if (path.includes(CONSTANTS.Market.MARKET.SWAP.toLowerCase())) {
                data = await this.action.Market.swap.getHistory({userId: user._id, type, limit, page, status, asUser})
            } else if (path.includes(CONSTANTS.Market.MARKET.P2P.toLowerCase())) {
                if(type === 'orderbook') {
                    data = await this.action.Market.p2p.getOrderBookHistory({userId: user._id, type, limit, page, status, query, order, asUser})
                } else {
                    data = await this.action.Market.p2p.getOrderHistory({userId: user._id, type, limit, page, status, query, order, asUser})
                }
            }

            return ResponseFormat.formatResponse(200, 'OK', data)
        } catch (error) {
            throw error
        }
    }

    addWhitelist = async ({addresses}) => {
        try {
            let data = await this.action.Market.ido.addWhitelist(addresses)

            return ResponseFormat.formatResponse(200, 'OK', data)
        } catch (error) {
            throw error
        }
    }

    placeOrder = async ({user, project, type, quantity, expiry, bases, price, limit, bank}) => {
        let newOrder = null

        if(bank) {
            const bankAcc = await this.model.BankAccount.findOne({
                user: user._id,
                _id: bank,
                inactive: { $ne: true }
            })
            if(!bankAcc) {
                throw RestError.NewBadRequestError(`Bank account ${bank} not found`)
            }
        }

        if (type == CONSTANTS.Market.ORDER.BUY) {
            newOrder = await this.action.Market.p2p.placeBuyOrder({
                userId: user._id,
                projectId: project,
                quantity,
                bases,
                expiry,
                price,
                limit,
                bank
            })
        }
        else {
            newOrder = await this.action.Market.p2p.placeSellOrder({
                userId: user._id,
                projectId: project,
                quantity,
                bases,
                expiry,
                price,
                limit,
                bank
            })
        }
        return ResponseFormat.formatResponse(200, 'OK', newOrder)
    }


    cancelOrderBook = async ({user, orderbookId}) => {
        try {
            const result = await this.action.Market.p2p.cancelOrderBook({user, orderbookId})
            return ResponseFormat.formatResponse(200, 'OK', result)
        } catch(error) {
            console.error(error)
            throw error
        }
    }

    fulfillOrder = async ({user, path, project, pair, type, quantity, expiry, base, orderBookId, code}) => {
        if(!code) {
            const type = await Tfa.generate2FaCache(this.model.Tfa)(user, `fulfillOrder:${path}`)
            return ResponseFormat.formatResponse(200, 'OK', type)
        } else {
            await Tfa.verify2FaCache(this.model.Tfa)(user, `fulfillOrder:${path}`, code)
        }

        let newOrder = undefined

        if (path.includes(CONSTANTS.Market.MARKET.IDO.toLowerCase())) {
            newOrder = await this.action.Market.ido.fulfillOrder({
                userId: user._id,
                quantity,
                expiry,
                project,
            })
        } else if (path.includes(CONSTANTS.Market.MARKET.SWAP.toLowerCase())) {
            let data = await this.model.BcWallet.findOne({user: user._id})
            if (!data) {
                const newWallet = BscService.generateAccount(process.env[`${process.env.MODE}_USER_NMEMONIC_ENABLE`])
                data = await this.model.BcWallet.createOne({
                    user: user._id,
                    address: newWallet.address,
                    private_key: Utils.Encrypt.encrypt(newWallet.privateKey),
                    mnemonic: newWallet.mnemonic,
                    default: true,
                })
            }

            newOrder = await this.action.Market.swap.fulfillOrder({
                pair,
                type,
                userId: user._id,
                quantity,
                expiry,
            })
        } else if (path.includes(CONSTANTS.Market.MARKET.P2P.toLowerCase())) {
            newOrder = await this.action.Market.p2p.fulfillOrder({
                type,
                userId: user._id,
                orderBookId,
                quantity,
                base,
            })
        } else {
            throw RestError.NewBadRequestError(`path not found`)
        }

        return ResponseFormat.formatResponse(200, 'OK', newOrder)
    }


    markSendFiat = async ({user, orderId, file}) => {
        const order = await this.model.Order.getModel().findOne({_id: orderId}).populate('orderbook')
        if(order.status != CONSTANTS.Market.ORDER_STATUS.WAITING_FIAT_SEND) {
            throw RestError.NewBadRequestError(`Order should be in waiting status. Current status is ${order.status}`)
        }
        if(order.symbol != CONSTANTS.Market.PAIR.STOCK_VND) {
            throw RestError.NewBadRequestError(`Only support p2p trading in STOCK/VND pair`)
        }

        const maker = await this.model.User.getModel().findOne({_id: order.orderbook.owner})
        if(!maker) {
            throw RestError.NewInternalServerError(`Cannot found maker information of orderbook ${order.orderbook}`)
        }

        if(file) {
            const {Location: location} = await S3.uploadImagePublic(file, `mark-send-fiat-${orderId}`, 'p2p', user._id)
            order.bank_statement = `${location}`
        } else {
            order.bank_statement = `no transaction image`
        }
        order.status = CONSTANTS.Market.ORDER_STATUS.WAITING_FIAT_CONFIRM
        await order.save()

        Email.sendEmailP2pSendNotice({
            email: maker.email,
            orderId: order._id,
            orderNo: order.order_no,
            stock: order.symbol,
            quantity: order.quantity,
            totalPrice: round(order.quantity * order.price, 0),
            unit: CONSTANTS.Market.SYMBOL.VND,
            bank: 'bank transfer'
        }) // notice 

        return ResponseFormat.formatResponse(200, 'OK', order)
    }


    markReceiveFiat = async ({user, orderId, file}) => {
        const order = await this.model.Order.getModel().findOne({_id: orderId}).populate('orderbook')
        if(order.status != CONSTANTS.Market.ORDER_STATUS.WAITING_FIAT_CONFIRM) {
            throw RestError(`Order should be in waiting status. Current status is ${order.status}`)
        }
        if(order.symbol != CONSTANTS.Market.PAIR.STOCK_VND) {
            throw RestError(`Only support p2p trading in STOCK/VND pair`)
        }
        if(order.orderbook.owner.toString() != user._id.toString()) {
            throw RestError.NewNotAcceptableError(`Permission denied!`)
        }

        const taker = await this.model.User.getModel().findOne({_id: order.owner})
        if(!taker) {
            throw RestError.NewInternalServerError(`Cannot found taker information of order ${order._id}`)
        }

        order.status = CONSTANTS.Market.ORDER_STATUS.PENDING
        await order.save()

        Email.sendEmailP2pFinalizeNotice({
            email: taker.email,
            orderId: order._id,
            orderNo: order.order_no,
            stock: order.symbol,
            quantity: order.quantity,
            totalPrice: round(order.quantity * order.price, 0),
            unit: CONSTANTS.Market.SYMBOL.VND,
            bank: 'bank transfer'
        }) // notice 

        await Queue.add(QUEUE_NAME.CONTRACT_EXCHANGE_STOCK_FIAT, {order_id: order._id})

        return ResponseFormat.formatResponse(200, 'OK', order)
    }

    editOrder = async ({}) => {
        // only admin
    }
}

module.exports = Market
