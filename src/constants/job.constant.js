const QUEUE_NAME = {
    SCHEDULE_QUEUE: `${process.env.NODE_ENV}-schedule-queue`,
    BSC_DEPOSIT_QUEUE: `${process.env.NODE_ENV}-bsc-deposit`,
    BSC_WITHDRAW_QUEUE: `${process.env.NODE_ENV}-bsc-withdraw`,
    P2P_ORDER_FULFILLMENT: `${process.env.NODE_ENV}-p2p-order-fulfillment`,
    SWAP_ORDER_FULFILLMENT: `${process.env.NODE_ENV}-swap-order-fulfillment`,
    CONTRACT_CREATE_PROJECT: `${process.env.NODE_ENV}-contract-create-project`,
    CONTRACT_BUY_IDO_FINALIZE: `${process.env.NODE_ENV}-contract-buy-ido-finalize`,
    CONTRACT_BUY_IDO: `${process.env.NODE_ENV}-contract-buy-ido`,
    CONTRACT_BUY_IDO_PREPARE: `${process.env.NODE_ENV}-contract-buy-ido-prepare`,
    CONTRACT_EXCHANGE_STOCK: `${process.env.NODE_ENV}-contract-exchange-stock`,
    CONTRACT_SWAP_TOKEN: `${process.env.NODE_ENV}-contract-swap-bre`,
    CONTRACT_EXCHANGE_STOCK_USDR: `${process.env.NODE_ENV}-contract-exchange-stock-bre`,
    CONTRACT_EXCHANGE_STOCK_FIAT: `${process.env.NODE_ENV}-contract-exchange-stock-fiat`,
    CONTRACT_ADD_WHITELIST: `${process.env.NODE_ENV}-contract-add-whitelist`,
    CONTRACT_VOTE_ACCEPT_OFFER: `${process.env.NODE_ENV}-vote-accept-offer`,
    CONTRACT_VOTE_REJECT_OFFER: `${process.env.NODE_ENV}-vote-reject-offer`,
    CONTRACT_CANCEL_VOTE_OFFER: `${process.env.NODE_ENV}-cancel-vote-offer`,
    CONTRACT_CLAIM_REWARD: `${process.env.NODE_ENV}-contract-claim-reward`,
}

const CRON_JOB = {
    EVERY_FOUR_HOURS: '0 */4 * * *',
    EVERY_EACH_HOUR: '0 */1 * * *',
    EVERY_EACH_HOUR_15: '15 * * * *',
    EVERY_EACH_HOUR_30: '30 * * * *',
    EVERY_FIVE_MINUTES: '*/5 * * * *',
    EVERY_FIVE_MINUTES_10: '10 */5 * * * *',
    EVERY_FIVE_MINUTES_20: '20 */5 * * * *',
    EVERY_FIVE_MINUTES_30: '30 */5 * * * *',
    EVERY_FIVE_MINUTES_40: '40 */5 * * * *',
    EVERY_FIVE_MINUTES_50: '50 */5 * * * *',
    EVERY_TWO_MINUTES: '*/2 * * * *',
    EVERY_TWO_MINUTES_15: '15 */2 * * * *',
    EVERY_TWO_MINUTES_30: '30 */2 * * * *',
    EVERY_TWO_MINUTES_45: '45 */2 * * * *',
    EVERY_THREE_MINUTES: '*/3 * * * *',
    EVERY_THREE_MINUTES_15: '15 */3 * * * *',
    EVERY_THREE_MINUTES_30: '30 */3 * * * *',
    EVERY_THREE_MINUTES_45: '45 */3 * * * *',
    EVERY_MINUTE: '* * * * *',
    EVERY_MINUTE_15: '15 * * * * *',
    EVERY_MINUTE_30: '30 * * * * *',
    EVERY_MINUTE_45: '45 * * * * *',
    EVERY_THIRTY_SECONDS: '*/30 * * * * *',
    EVERY_TEN_SECONDS: '*/10 * * * * *',
}

const SCHEDULE_NAME = {
    PROJECT_CONFIRM_OFFER_FINALIZE_JOB: 'PROJECT_CONFIRM_OFFER_FINALIZE_JOB',
    PROJECT_CONFIRM_OFFER_FAILED_JOB: 'PROJECT_CONFIRM_OFFER_FAILED_JOB',
    PROJECT_CONFIRM_VOTE_FINALIZE_JOB: 'PROJECT_CONFIRM_VOTE_FINALIZE_JOB',
    PROJECT_CONFIRM_VOTE_FAILED_JOB: 'PROJECT_CONFIRM_VOTE_FAILED_JOB',
    PROJECT_CONFIRM_CLAIM_FINALIZE_JOB: 'PROJECT_CONFIRM_CLAIM_FINALIZE_JOB',
    PROJECT_CONFIRM_CLAIM_FAILED_JOB: 'PROJECT_CONFIRM_CLAIM_FAILED_JOB',
    PROJECT_CONFIRM_EXCHANGE_FINALIZE_JOB: 'PROJECT_CONFIRM_EXCHANGE_FINALIZE_JOB',
    PROJECT_CONFIRM_EXCHANGE_FAILED_JOB: 'PROJECT_CONFIRM_EXCHANGE_FAILED_JOB',
    PROJECT_CONFIRM_IDO_FINALIZE_JOB: 'PROJECT_CONFIRM_IDO_FINALIZE_JOB',
    PROJECT_CONFIRM_IDO_FAILED_JOB: 'PROJECT_CONFIRM_IDO_FAILED_JOB',
    CONFIRM_SWAP_FINALIZE_JOB: 'CONFIRM_SWAP_FINALIZE_JOB',
    CONFIRM_SWAP_FAILED_JOB: 'CONFIRM_SWAP_FAILED_JOB',
    SCAN_DEPOSIT_BSC: 'SCAN_DEPOSIT_BSC',
    REFERRAL_REWARD: 'REFERRAL_REWARD',
    REFERRAL_REGISTRATION_REWARD: 'REFERRAL_REGISTRATION_REWARD',
    BOUNTY_COMPLETION_REWARD: 'BOUNTY_COMPLETION_REWARD',
    SYNC_PROJECT: 'SYNC_PROJECT',
}

module.exports = {
    QUEUE_NAME,
    CRON_JOB,
    SCHEDULE_NAME,
}
