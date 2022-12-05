//remove dotenv config.config()
module.exports = {
    TESTNET: {
        MARKET_EVENT: 'https://sqs.ap-southeast-1.amazonaws.com/835223875808/DEV_MARKET_EVENT',
        FEE_POOL:"https://sqs.ap-southeast-1.amazonaws.com/835223875808/DEV_FEE_POOL"
    },

    MAINNET: {
        MARKET_EVENT: 'https://sqs.ap-southeast-1.amazonaws.com/835223875808/DEV_MARKET_EVENT',
    },
}
