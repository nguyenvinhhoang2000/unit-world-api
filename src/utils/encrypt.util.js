require('dotenv').config()
const crypto = require('crypto')
const CONSTANTS = require('../constants')
const cc = require('coupon-code')
// const iv = crypto.randomBytes(16).toString('hex').slice(0, 16);
console.log(`${process.env.MODE && process.env.MODE.toUpperCase()}_ENCRYPTION_KEY`)
const iv = process.env[`${process.env.MODE && process.env.MODE.toUpperCase()}_ENCRYPTION_KEY`].slice(0, 16)

function generateReferralCode() {
    return cc.generate({parts: 4})
}

function validateReferralCode(code) {
    return cc.validate(code, {parts: 4}) == code
}

function encryptPassword(salt, password, algo) {
    let hash = crypto.pbkdf2Sync(password, salt, 10000, 512, algo).toString('hex')
    return hash
}

function generatePassword(password) {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = encryptPassword(salt, password, CONSTANTS.UtilsConst.HASH_ALGORITHMS)
    return {
        salt: salt,
        hash: hash,
        alg: CONSTANTS.UtilsConst.HASH_ALGORITHMS,
    }
}

function encrypt(text, encryptionKey = null) {
    try {
        encryptionKey = crypto
            .createHash('sha256')
            .update(
                encryptionKey || process.env[`${process.env.MODE && process.env.MODE.toUpperCase()}_ENCRYPTION_KEY`],
            )
            .digest()
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv)
        let encrypted = cipher.update(text)

        encrypted = Buffer.concat([encrypted, cipher.final()])
        // console.log('text encrypt: ' + encrypted.toString('hex'))
        return encrypted.toString('hex')
    } catch (error) {
        console.log(error)
        return null
    }
}

function decrypt(text, encryptionKey = null) {
    try {
        encryptionKey = crypto
            .createHash('sha256')
            .update(
                encryptionKey || process.env[`${process.env.MODE && process.env.MODE.toUpperCase()}_ENCRYPTION_KEY`],
            )
            .digest()
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv)
        let decrypted = decipher.update(text, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        // console.log(decrypted)
        return decrypted
    } catch (error) {
        console.log(error)
        return null
    }
}

module.exports = {
    encryptPassword,
    generatePassword,
    encrypt,
    decrypt,
    generateReferralCode,
    validateReferralCode,
}
