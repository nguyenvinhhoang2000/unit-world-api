const User = require('./user.route')
const Tfa = require('./tfa.route')
const Kyc = require('./kyc.route')
const Referral = require('./referral.route')
const Project = require('./project.route')
const Stock = require('./stock.route')
const Wallet = require('./wallet.route')
const Setting = require('./setting.route')
const Market = require('./market.route')
const Rank = require('./rank.route')
const Bounty = require('./bounty.route')
const Stake = require('./stake.route')

const express = require('express')
const BASE_API = '/api/v1'

module.exports = class RouterRepository {
    constructor(opts) {
        this.app = express()

        this.User = new User(opts)
        this.Tfa = new Tfa(opts)
        this.Kyc = new Kyc(opts)
        this.Ref = new Referral(opts)
        this.Project = new Project(opts)
        this.Stock = new Stock(opts)
        this.Wallet = new Wallet(opts)
        this.Setting = new Setting(opts)
        this.Market = new Market(opts)
        this.Rank = new Rank(opts)
        this.Bounty = new Bounty(opts)
        this.Stake = new Stake(opts)
    }

    routerApi = () => {
        this.app.use(`${BASE_API}/user`, this.User.getRouter())
        this.app.use(`${BASE_API}/tfa`, this.Tfa.getRouter())
        this.app.use(`${BASE_API}/kyc`, this.Kyc.getRouter())
        this.app.use(`${BASE_API}/ref`, this.Ref.getRouter())
        this.app.use(`${BASE_API}/project`, this.Project.getRouter())
        this.app.use(`${BASE_API}/stock`, this.Stock.getRouter())
        this.app.use(`${BASE_API}/wallet`, this.Wallet.getRouter())
        this.app.use(`${BASE_API}/market`, this.Market.getRouter())
        this.app.use(`${BASE_API}/setting`, this.Setting.getRouter())
        this.app.use(`${BASE_API}/rank`, this.Rank.getRouter())
        this.app.use(`${BASE_API}/bounty`, this.Bounty.getRouter())
        this.app.use(`${BASE_API}/stake`, this.Stake.getRouter())

        return this.app
    }
}
