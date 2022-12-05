module.exports = {
    RATE_TYPE: {
        FIXED: 0,
        FLOAT: 1,
        USER_DEFINED: 2,
    },

    PAIR: {
        USDR_USDT: 'USDR/USDT',
        USDR_VND: 'USDR/VND',
        REX_VND: 'REX/VND',
        REX_USDT: 'REX/USDT',
        STOCK_USDR: 'STOCK/USDR',
        STOCK_VND: 'STOCK/VND',
    },

    SYMBOL: {
        USDR: 'USDR',
        USDT: 'USDT',
        VND: 'VND',
        STOCK: 'STOCK',
        REX: 'REX'
    },

    MARKET: {
        P2P: 'P2P',
        IDO: 'IDO',
        SWAP: 'SWAP',
    },

    ROLE: {
        TAKER: 'TAKER',
        MAKER: 'MAKER',
    },

    ORDER: {
        BUY: 'B',
        SELL: 'S',
    },

    ORDER_STATUS: {
        OPEN: 'O',
        CLOSE: 'C',
        WAITING_FIAT_SEND: 'WFS',
        WAITING_FIAT_CONFIRM: 'WFC',
        PENDING: 'P',
        PREPARING: 'PR',
        PROCESSING: 'PC',
        FULFILLED: 'FF',
        FULFILLED_REFERRAL: 'FFR',
        PARTIALLY_FULFILLED: 'PF',
        FAILED: 'F',
        CANCELLED: 'CL',
        REFUND: 'RF',
        DISPUTE: 'DP',
    },
}
