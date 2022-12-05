const CONSTANTS = require('../constants')

const RedisClient = require('../connections/redis')
const redis = RedisClient.getInstance().getConnection()

//verify number
async function saveNumberVerify(user_id, number) {
    try {
        let data = await redis.set('VERIFY-' + user_id, number, 'EX', CONSTANTS.UtilsConst.NUMBER_VERIFY_DURATION)
        // console.log(data)
    } catch (error) {
        console.log(error)
    }
}

async function getNumberVerify(user_id) {
    let number = await redis.get('VERIFY-' + user_id)
    // console.log(number)
    return number
}

async function removeNumberVerify(user_id) {
    await redis.del('VERIFY-' + user_id)
}

//refreshtoken
async function getRefreshToken(user_id, refreshToken) {
    return await redis.get('REFRESH-' + user_id + refreshToken.toString())
}

async function saveRefreshToken(user_id, refreshToken) {
    return await redis.set(
        'REFRESH-' + user_id + refreshToken.toString(),
        refreshToken,
        'EX',
        CONSTANTS.UtilsConst.REFRESH_TOKEN_DURATION,
    )
}

async function removeRefreshToken(user_id, refreshToken) {
    await redis.del('REFRESH-' + user_id + refreshToken.toString())
}

//blacklist token
async function saveDataBlacklistTokens(token, user_id) {
    let blacklists = await redis.get('DATA_BLACKLIST_TOKEN_' + user_id)
    let blacklistTokens = blacklists ? JSON.parse(blacklists) : []
    if (!blacklistTokens.includes(token)) {
        blacklistTokens.push(token)
    }
    await redis.set(
        'DATA_BLACKLIST_TOKEN_' + user_id,
        JSON.stringify(blacklistTokens),
        'EX',
        CONSTANTS.UtilsConst.JWT_TOKEN_DURATION,
    )
}

async function removeDataBlacklistTokens(user_id) {
    await redis.del('DATA_BLACKLIST_TOKEN_' + user_id)
}

async function getDataBlacklistTokens(user_id) {
    const blacklistTokens = await redis.get('DATA_BLACKLIST_TOKEN_' + user_id)
    return !blacklistTokens ? null : JSON.parse(blacklistTokens)
}

module.exports = {
    saveNumberVerify,
    getNumberVerify,
    removeNumberVerify,
    getRefreshToken,
    saveRefreshToken,
    removeRefreshToken,
    saveDataBlacklistTokens,
    removeDataBlacklistTokens,
    getDataBlacklistTokens,
}
