const ReferralAction = require('./referral.action')
const WalletAction = require('./wallet')
const MarketAction = require('./market')
const KycAction = require('./kyc.action')
const ProjectAction = require('./project.action')
const StockAction = require('./stock.action')
const ContractUsdr = require('./contract-usdr.action')
const ContractProject = require('./contract-project.action')
const Stake = require('./stake.action')
const RankAction = require('./rank.action')

module.exports = class ActionRepository {
    constructor(opt) {
        this.Referral = ReferralAction.getInstance(opt)
        this.Wallet = WalletAction.getInstance(opt)
        this.Kyc = KycAction.getInstance(opt)
        this.Project = new ProjectAction(opt)
        this.Stock = new StockAction(opt)
        this.Market = new MarketAction(opt)
        this.ContractUsdr = new ContractUsdr(opt)
        this.ContractProject = new ContractProject(opt)
        this.Stake = new Stake(opt)
        this.Rank = new RankAction(opt)
    }
}
