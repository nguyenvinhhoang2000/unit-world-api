'use strict'

const Models = require('../src/entities')
const {USER} = require('../src/constants/entity.constant')
const {generatePassword} = require('../src/utils/encrypt.util')

module.exports.up = async function (next) {
  console.log('DB migration running up..')
  
  let admin = await Models.User.findOne({role: USER.ROLES.ADMIN}).lean()
  if(!admin) {
    const passwordData = generatePassword('1234567890')
    admin = await Models.User.create({
        email:'admin@rex.io',
        username: 'admin',
        name: 'admin',
        password: passwordData.hash,
        password_salt: passwordData.salt,
        password_alg: passwordData.alg,
        status: USER.STATUS.COMPLETED,
        role: USER.ROLES.ADMIN
    })
    const data = {
      user: admin._id,
      usdt: {
          available_balance: 0,
          balance: 0,
      },
      fiat: {
          available_balance: 0,
          balance: 0,
      },
      token: {
          available_balance: 0,
          balance: 0,
          available_commission: 0,
          commission: 0,
      },
    }
    const wallet = await Models.Wallet.create(data)
    console.log({admin, wallet})
  }
  let leader = await Models.User.findOne({role: USER.ROLES.LEADER}).lean()
  if(!leader) {
    const passwordData = generatePassword('1234567890')
    leader = await Models.User.create({
        email:'leader@rex.io', // need update email later
        username: 'leader',
        name: 'leader',
        password: passwordData.hash,
        password_salt: passwordData.salt,
        password_alg: passwordData.alg,
        status: USER.STATUS.COMPLETED,
        role: USER.ROLES.LEADER
    })

    const data = {
      user: leader._id,
      usdt: {
          available_balance: 0,
          balance: 0,
      },
      fiat: {
          available_balance: 0,
          balance: 0,
      },
      token: {
          available_balance: 0,
          balance: 0,
          available_commission: 0,
          commission: 0,
      },
    }
    const wallet = await Models.Wallet.create(data)
    console.log({leader, wallet})
  }

  let accounting = await Models.User.findOne({role: USER.ROLES.ACCOUNTING}).lean()
  if(!accounting) {
    const passwordData = generatePassword('1234567890')
    accounting = await Models.User.create({
        email:'accounting@rex.io', // need update email later
        username: 'accounting',
        name: 'accounting',
        password: passwordData.hash,
        password_salt: passwordData.salt,
        password_alg: passwordData.alg,
        status: USER.STATUS.COMPLETED,
        role: USER.ROLES.ACCOUNTING
    })

    const data = {
      user: accounting._id,
      usdt: {
          available_balance: 0,
          balance: 0,
      },
      fiat: {
          available_balance: 0,
          balance: 0,
      },
      token: {
          available_balance: 0,
          balance: 0,
          available_commission: 0,
          commission: 0,
      },
    }
    const wallet = await Models.Wallet.create(data)
    console.log({accounting, wallet})
  }


  next()
}

module.exports.down = async function (next) {
  console.log('DB migration running down..')
  next()
}
