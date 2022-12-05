const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const DBSetting = require('../configs/db/mongo')
const migrate = require('migrate')

const Entity = require('../entities')

const ActivityLog = require('./activity-log.model')
const Address = require('./address.model')
const BankAccount = require('./bank-account.model')
const BankExchange = require('./bank-exchange.model')
const BankOrder = require('./bank-order.model')
const Bounty = require('./bounty.model')
const Exchange = require('./exchange.model')
const Kyc = require('./kyc.model')
const Referral = require('./referral.model')
const Order = require('./order.model')
const Project = require('./project.model')
const Stock = require('./stock.model')
const SystemSetting = require('./system-setting.model')
const Tfa = require('./tfa.model')
const Transaction = require('./transaction.model')
const User = require('./user.model')
const Wallet = require('./wallet.model')
const WalletHistory = require('./wallet-history.model')
const BcWallet = require('./bc-wallet.model')
const Market = require('./market.model')
const TransactionLog = require('./transaction-log.model')
const BankWithdraw = require('./bank-withdraw.model')
const BankDeposit = require('./bank-deposit.model')
const OrderBook = require('./order-book.model')
const Share = require('./share.model')
const Vote = require('./vote.model')
const Offer = require('./offer.model')
const ProjectInfo = require('./project-info.model')
const ClaimReward = require('./claim-reward.model')
const Rank = require('./rank.model')
const ContactUs = require('./contact-us.model')
const BountyCompletion = require('./bounty-completion.model')
const Stake = require('./stake.model')
const StakePackage = require('./stake-package.model')
const StakeAction = require('./stake-action.model')

module.exports = class ModelRepository {
    constructor() {
        this.dbConfig = DBSetting

        this.User = new User(Entity)
        this.ActivityLog = new ActivityLog(Entity)
        this.Address = new Address(Entity)
        this.BankAccount = new BankAccount(Entity)
        this.BankOrder = new BankOrder(Entity)
        this.BankWithdraw = new BankWithdraw(Entity)
        this.BankDeposit = new BankDeposit(Entity)
        this.Bounty = new Bounty(Entity)
        this.BountyCompletion = new BountyCompletion(Entity)
        this.Exchange = new Exchange(Entity)
        this.Kyc = new Kyc(Entity)
        this.Referral = new Referral(Entity)
        this.Order = new Order(Entity)
        this.Project = new Project(Entity)
        this.Stock = new Stock(Entity)
        this.SystemSetting = new SystemSetting(Entity)
        this.Tfa = new Tfa(Entity)
        this.Transaction = new Transaction(Entity)
        this.Wallet = new Wallet(Entity)
        this.BcWallet = new BcWallet(Entity)
        this.TransactionLog = new TransactionLog(Entity)
        this.Market = new Market(Entity)
        this.Share = new Share(Entity)
        this.OrderBook = new OrderBook(Entity)
        this.ProjectInfo = new ProjectInfo(Entity)
        this.Vote= new Vote(Entity)
        this.Offer= new Offer(Entity)
        this.WalletHistory= new WalletHistory(Entity)
        this.ClaimReward = new ClaimReward(Entity)
        this.Rank = new Rank(Entity)
        this.ContactUs = new ContactUs(Entity)
        this.Stake = new Stake(Entity)
        this.StakeAction = new StakeAction(Entity)
        this.StakePackage = new StakePackage(Entity)
        this.connect()
    }

    async connect() {
        if (mongoose.connection.readyState === 0) {
            const debug = process.env.MONGO_DEBUG ? process.env.MONGO_DEBUG : false
            mongoose.set('debug', debug)
            await mongoose.connect(this.dbConfig.url, this.dbConfig.options)
            console.log('connected', `,debug mode:`, debug)
            mongoose.connection.on('error', (error) => console.log(error))
            mongoose.connection.once('open', () => console.log(`Connect to quesera-db saving DB successfully!!!`))
            if (process.env.MODE == 'MAINNET') {
                process.env[`${process.env.MODE}_MONGO_STRING`] = null
            }

            migrate.load({stateStore: `.migrate-${process.env.NODE_ENV}`}, function (err, set) {
                if (err) {
                    console.error(err)
                    throw err
                }
                set.up(function (err) {
                    if (err) {
                        console.error(err)
                        throw err
                    }
                    console.log('migrations successfully ran')
                })
            })
        }
    }
}
