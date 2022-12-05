//remove dotenv config.config()
module.exports = {
    CACHE_KEY: {
        CONTRACT_OFFER: `${process.env.NODE_ENV}_CONTRACT_OFFER`,
        CONTRACT_PROJECT: `${process.env.NODE_ENV}_CONTRACT_PROJECT`
    },
    CACHE_TIME: {
        CONTRACT_OFFER: 30,
        CONTRACT_PROJECT: 30
    }
}
