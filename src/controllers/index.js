const User = require('./user.controller')
const TFA = require('./tfa.controller')
const KYC = require('./kyc.controller')
const REF = require('./referral.controller')
const Wallet = require('./wallet.controller')
const Setting = require('./setting.controller')
const Project = require('./project.controller')
const Market = require('./market.controller')
const ProjectContract = require('./project-contract.controller')
const Rank = require('./rank.controller')
const Bounty = require('./bounty.controller')
const Stake = require('./stake.controller')

module.exports = class ControllerRepository {
    constructor(opt) {
        this.User = new User(opt)
        this.Tfa = new TFA(opt)
        this.Kyc = new KYC(opt)
        this.Ref = new REF(opt)
        this.Wallet = new Wallet(opt)
        this.Setting = new Setting(opt)
        this.Project = new Project(opt)
        this.ProjectContract = new ProjectContract(opt)
        this.Market = new Market(opt)
        this.Rank = new Rank(opt)
        this.Bounty = new Bounty(opt)
        this.Stake = new Stake(opt)
    }
}
