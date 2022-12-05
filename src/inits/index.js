//Entity
const Entity = require('../entities')

//constant
const CONSTANTS = require('../constants')

//utils
const Utils = require('../utils')

async function init() {
    try {
        let data = require('./user.init.json')
        let users = []

        data.map(async (ele) => {
            await Entity.User.findOneAndUpdate({email: ele.email}, {role: ele.role})

            // let passwordData = Utils.Encrypt.generatePassword(ele.password)
            // users.push({
            //     email: ele.email,
            //     username: ele.username,
            //     name: ele.username,
            //     role: ele.role,
            //     password: passwordData.hash,
            //     password_salt: passwordData.salt,
            //     password_alg: passwordData.alg,
            //     country: "",
            //     birthday: "",
            //     status: CONSTANTS.EntityConst.USER.STATUS.COMPLETED,
            // })
        })

        // await Entity.User.insertMany(users)
        console.log('end')
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    init,
}
