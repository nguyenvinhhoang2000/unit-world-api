'use strict'
const Models = require('../src/entities')
const CONSTANTS = require('../src/constants')

module.exports.up = async function (next) {
  // init ido market
  const idoMarket = await Models.Market.findOne({market: CONSTANTS.Market.MARKET.IDO}).lean()
  if(!idoMarket) {
    await Models.Market.create({
        market:CONSTANTS.Market.MARKET.IDO,
        pair: {
          asset: CONSTANTS.Market.SYMBOL.STOCK,
          base: CONSTANTS.Market.SYMBOL.USDR
        },
        fee: {
          taker: 0,
          maker: 0
        },
        limit: {
          minimum: 1,
          maximum: Number.MAX_SAFE_INTEGER
        },
        active: true
    })
  }

  // init swap market
  const swapMarket = await Models.Market.findOne({market: CONSTANTS.Market.MARKET.SWAP}).lean()
  if(!swapMarket) {
    await Models.Market.create({
        market:CONSTANTS.Market.MARKET.SWAP,
        pair: {
          asset: CONSTANTS.Market.SYMBOL.USDR,
          base: CONSTANTS.Market.SYMBOL.USDT
        },
        fee: {
          taker: 0,
          maker: 0
        },
        limit: {
          minimum: 1,
          maximum: Number.MAX_SAFE_INTEGER
        },
        active: true
    })

    await Models.Market.create({
      market:CONSTANTS.Market.MARKET.SWAP,
      pair: {
        asset: CONSTANTS.Market.SYMBOL.USDR,
        base: CONSTANTS.Market.SYMBOL.VND
      },
      fee: {
        taker: 0,
        maker: 0
      },
      limit: {
        minimum: 1,
        maximum: Number.MAX_SAFE_INTEGER
      },
      active: true
  })
  }


  // init p2p market
  const p2pMarket = await Models.Market.findOne({market: CONSTANTS.Market.MARKET.P2P}).lean()
  if(!p2pMarket) {
    await Models.Market.create({
        market:CONSTANTS.Market.MARKET.P2P,
        pair: {
          asset: CONSTANTS.Market.SYMBOL.STOCK,
          base: CONSTANTS.Market.SYMBOL.VND
        },
        fee: {
          taker: 0,
          maker: 0
        },
        limit: {
          minimum: 1,
          maximum: Number.MAX_SAFE_INTEGER
        },
        active: true
    })

    await Models.Market.create({
        market:CONSTANTS.Market.MARKET.P2P,
        pair: {
          asset: CONSTANTS.Market.SYMBOL.STOCK,
          base: CONSTANTS.Market.SYMBOL.USDR
        },
        fee: {
          taker: 0,
          maker: 0
        },
        limit: {
          minimum: 1,
          maximum: Number.MAX_SAFE_INTEGER
        },
        active: true
    })
  }


  next()
}

module.exports.down = function (next) {
  next()
}
