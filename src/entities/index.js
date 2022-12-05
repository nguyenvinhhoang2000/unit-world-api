const ActivityLog = require('./activity-log.entity')
const Address = require('./address.entity')
const BankAccount = require('./bank-account.entity')
const BankDeposit = require('./bank-deposit.entity')
const BankWithdraw = require('./bank-withdraw.entity')
const Bounty = require('./bounty.entity')
const Exchange = require('./exchange.entity')
const Kyc = require('./kyc.entity')
const Referral = require('./referral.entity')
const Order = require('./order.entity')
const Project = require('./project.entity')
const Investor = require('./investor.entity')
const ProjectInfo = require('./project-info.entity')
const Stock = require('./stock.entity')
const SystemSetting = require('./system-setting.entity')
const Tfa = require('./tfa.entity')
const Transaction = require('./transaction.entity')
const TransactionLog = require('./transaction-log.entity')
const User = require('./user.entity')
const Wallet = require('./wallet.entity')
const BcWallet = require('./bc-wallet.entity')
const Market = require('./market.entity')
const OrderBook = require('./order-book.entity')
const Share = require('./share.entity')
const Offer = require('./offer.entity')
const Vote = require('./vote.entity')
const WalletHistory = require('./wallet-history.entity')
const ClaimReward = require('./claim-reward.entity')
const Rank = require('./rank.entity')
const ContactUs = require('./contact-us.entity')
const BountyCompletion = require('./bounty-completion.entity')
const StakeAction = require('./stake-action.entity')
const StakingPackage = require('./stake-package.entity')
const Staking = require('./stake.entity')

module.exports = {
    StakeAction,
    StakingPackage,
    Staking,
    ActivityLog,
    Address,
    BankAccount,
    BankDeposit,
    BankWithdraw,
    Bounty,
    BountyCompletion,
    Exchange,
    Kyc,
    Order,
    Project,
    ProjectInfo,
    Investor,
    Stock,
    SystemSetting,
    Tfa,
    Referral,
    Transaction,
    TransactionLog,
    User,
    Wallet,
    BcWallet,
    Market,
    OrderBook,
    Share,
    Offer,
    Vote,
    ClaimReward,
    WalletHistory,
    Rank,
    ContactUs
}
