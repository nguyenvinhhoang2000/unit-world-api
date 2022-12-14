module.exports = {
    USER: {
        STATUS: {
            WAITING_VERIFICATION: 'W',
            PROCESSING: 'P',
            COMPLETED: 'C',
            BLOCKED: 'B',
        },
        GENDER: {
            MALE: 'M',
            FEMALE: 'F',
            OTHER: 'O',
        },
        ROLES: {
            OWNER: 'O',
            ADMIN: 'A',
            USER: 'U',
            LEADER: 'L',
            ACCOUNTING: 'AC'
        },
    },
    CONTACT_US: {
        STATUS: {
            PENDING: 'P',
            CANCELED: 'CL',
            COMPLETED: 'C'
        }
    },
    TFA: {
        ACTIVE: 'A',
        INACTIVE: 'I',
    },
    WALLET_HISTORY: {
        STATUS: {
            COMPLETED: 'C'
        },
        ACTION: {
            BUY_IDO_PRECHARGE: 'BUY_IDO_PRECHARGE',
            P2P_ORDERBOOK_SELL: 'P2P_ORDERBOOK_SELL',
            P2P_ORDER_SELL: 'P2P_ORDER_SELL',
            P2P_ORDERBOOK_CANCEL: 'P2P_ORDERBOOK_CANCEL',
            SWAP_USDR: 'SWAP_USDR',
            SWAP_REX: 'SWAP_REX',
            WITHDRAWAL_USDT: 'WITHDRAWAL_USDT'
        }
    },
    REFERRAL: {
        REWARD: {
            WAITING: 'W',
            PROCESSING: 'P',
            COMPLETED: 'C',
            ERROR: 'F',
        },
    },
    KYC: {
        TYPE: {
            PASSPOST: 'PP', // step2
            ID_CARD: 'ID', // step2
            INVOICE_ELECTRICAL: 'IV_E', // step4
            INVOICE_WATER: 'IV_W', // step4
            INVOICE_INTERNET: 'IV_I', // step4
            INVOICE_BANKING: 'IV_B', // step4
            INVOICE: 'IV', // step4
            LEGAL_TEMP_RESIDENCE: 'LTR', // step4
            PERSIONAL: 'PE', // step3
        },
        SIDE: {
            FRONT: 'FR',
            BACK: 'BA',
            DEFAULT: 'DE',
        },
        STATUS: {
            WAITING: 'W',
            PENDING: 'P',
            PROCESSING: 'PC',
            COMPLETED: 'C',
            CANCELLED: 'CL',
            REJECTED: 'RJ',
        },
        STEP: {
            STEP_GENERAL: 'step_1',
            STEP_DOCCUMENT: 'step_2',
            STEP_PERSONAL: 'step_3',
            STEP_ADDRESS: 'step_4',
        },
    },
    TRANSACTION: {
        GATEWAY: {
            BSC: 'BSC',
        },
        TYPE: {
            DEPOSIT: 'D',
            WITHDRAW: 'W',
            REWARD: 'R',
            CLAIM: 'C',
            FEE: 'F',
            SWAP: 'S',
        },
        CURRENCY: {
            ADA: 'ADA',
            BNB: 'BNB',
            USDT: 'USDT',
            TOKEN: 'TOKEN',
            PUBLIC_TOKEN: 'PUBLIC_TOKEN',
            VND: 'VND',
            STOCK: 'STOCK'
        },
        STATUS: {
            WAITING: 'W',
            PENDING: 'P',
            PROCESSING: 'PC', //ti???n h??nh tr???
            COMPLETED: 'C', //x??c nh???n giao d???ch th??nh c??ng
            CANCELED: 'CL', //user ko confirm
            FAILED: 'F',
        },
    },
    WITHDRAW_REQUEST: {
        STATUS: {
            PENDING: 'P',
            PROCESSING: 'PC', //ti???n h??nh tr???
            COMPLETED: 'C', //r??t ho??n th??nh
            CANCELED: 'CL', //user ko confirm
            FAILED: 'F', //r??t failed
        },
    },
    BANK_ACCOUNT: {
        BANK_TYPE: {
            VIETINBANK: 'VIETINBANK',
            VIETCOMBANK: 'VIETCOMBANK',
            VPBANK: 'VPBANK',
            MBBANK: 'MBBANK',
        },
        TYPE: {
            USER: 'U',
            SYSTEM: 'S',
        },
    },
    BANK_DEPOSIT: {
        STATUS: {
            WAITING_USER_TRANSFER: 'WUT',
            WAITING_SYSTEM_VERIFY: 'WSV',
            SUCCEEDED: 'S',
            FAILED: 'F',
            CANCELED: 'CL',
        },
        CURRENCY: {
            VND: 'VND',
            USDT: 'USDT',
        },
    },
    BANK_WITHDRAW: {
        STATUS: {
            WAITING: 'W',
            CANCELED: 'CL', //user c?? th??? cancel khi status l?? waiting
            PROCESSING: 'WSV',
            SUCCEEDED: 'S',
            FAILED: 'F',
        },
        CURRENCY: {
            VND: 'VND',
            USDT: 'USDT',
        },
    },
    BANK_EXCHANGE: {
        STATUS: {
            WAITING: 'W',
            CANCELED: 'CL', //user c?? th??? cancel khi status l?? waiting
            PROCESSING: 'WSV',
            SUCCEEDED: 'S',
            FAILED: 'F',
        },
    },
    BOUNTY: {
        STATUS: {
            ACTIVE: 'A',
            INACTIVE: 'I'
        },
        COMPLETION_STATUS: {
            PENDING: 'P',
            COMPLETED: 'C',
            REQUEST_REWARD: 'RR',
            REWARDING: 'RWG',
            REWARDED: 'RWD',
            REJECTED: 'RJ'
        },
        PLATFORM: {
            FACEBOOK: 'FB',
            ZALO: 'ZA',
            INSTAGRAM: 'IG'
        }
    },
    STAKE: {
        STATUS: {
            STAKING: 'STAKING', //??ang staking
            CANCELLED: 'CANCELLED', //HU??? staking -> ch???t l??i s???m,
            WAITING_CLAIM_REWARD: 'WAITING_CLAIM_REWARD', //???? ho??n th??nh qu?? tr??nh stake, ?????i claimed
            COMPLETED: 'COMPLETED', //???? ho??n th??nh
        },
        ACTION: {
            STAKING: 'STAKING', // t???o staking
            UNSTAKING: "UNSTAKING", //hu??? staking
            WAITING_CLAIM_REWARD: "WAITING_CLAIM_REWARD", //c?? th??? nh???n l??i v??? 
            CLAIM_REWARDS: "CLAIM_REWARDS" //nh???n l??i sau khi k???t th??c th???i gian stake
        },
    },
    ORDER: {
        STATUS: {
            OPEN: 'O',
            CLOSE: 'C',
            PENDING: 'P',
            PREPARING: 'PR',
            PROCESSING: 'PC',
            FULFILLED: 'FF',
            FULFILLED_REFERRAL: 'FFR',
            PARTIALLY_FULFILLED: 'PF',
            FAILED: 'F',
            CANCELLED: 'CL',
            REFUND: 'RF',
        },
    },
    EXCHANGE: {
        STATUS: {
            PROCESSING: 'PC', //ti???n h??nh tr???
            WAITING_SELLER_TRANSFER: 'WST', // ?????i ng?????i b??n chuy???n
            FAILED: 'F', // failed khi giao d???ch ko ???????c th???c hi???n -> seller ko chuy???n ti???n trong th???i gian quy ?????nh ho???c ???? hu??? b??? giao d???ch
            WAITING_BUYER_CONFIRM: 'WBC', //?????i ng?????i mua x??c nh???n ???? nh???n
            BUYER_COMPLAIN: 'BCP', // buyer khi???u n???i v?? seller ch??a chuy???n ti???n m?? l???i ???? th??ng b??o l?? ???? g???i (sau 1 kho???ng th???i gian m?? ch??a nh???n dc m???c d?? seller ???? confirm)
            SELLER_COMPLAIN: 'SCP', // seller khi???u n???i vi???c buyer ko confirm
            REFUNDING: 'RI', ///khi khi???u n???i ???????c gi???i quy???t. ti???n ???????c x??? l?? tr??? v??? ng?????i b??? kho??
            REFUNDED: 'RD', ///khi ho??n th??nh vi???c refund
            COMPLETED: 'C', //x??c nh???n giao d???ch th??nh c??ng - khi buyer confirm nh???n dc
        },
    },
    PROJECT: {
        STATUS: {
            WAITING: 'W', //??ang x??? l??, chua day len contract -> ch??? show cho admin
            PENDING: 'P', //??ang m??? b??n -> da dua len contract
            PROCESSING: 'PC', //??ang m??? b??n -> da dua len contract
            FINISHED: 'FN', //k???t th??c m??? b??n
            RELEASED: 'RL', // release sau khi het lock time, dang duoc chao ban
            SOLD: 'SD', // da ban
            DISTRIBUTED: 'DT', // da phan phoi cho user lai
            CANCELED: 'CL', //hu??? project -> ch??? hu??? khi ch??a m??? b??n
            REFUNDED: 'RF', //Hu??? project -> tr??? l???i ti???n nh?? ?????u t??
            FAILED: 'F', //Hu??? project -> tr??? l???i ti???n nh?? ?????u t??
        },
        STATUS_USER: {
            PENDING: 'P', //??ang ?????i m??? b??n
            PROCESSING: 'PC', //??ang m??? b??n
            FINISHED: 'FN', //k???t th??c m??? b??n
            REFUNDED: 'RF', //Hu??? project -> tr??? l???i ti???n nh?? ?????u t??
        },
        SORT_BY: {
            OPEN_TIME: 'OPEN_TIME',
            CLOSE_TIME: 'CLOSE_TIME',
            BEST_VOLUME: 'BEST_VOLUME',
            HOT_TREND: 'HOT_TREND',
        },
        STOCK: 'STOCK',
    },

    CLAIM: {
        STATUS: {
            PENDING: 'P',
            PROCESSING: 'PC',
            FINISHED: 'FN',
            CANCELED: 'CL',
            FAILED: 'F',
        },
    },

    VOTE: {
        STATUS: {
            PENDING: 'P', //???? add request vote/unvote v??o queue 
            COMPLETED: 'C', //???? th???c hi???n xong vote/unvote
            FAILED: 'F', //vote/unvote th???t b???i
        }
    },

    TOKEN: {
        BNB: 'BNB',
        USDT: 'USDT',
        USDR: 'USDR',
        REX: 'REX'
    },

    RANK: {
        RATE_TYPE: {
            STORED: 'STORED'
        },
        STATUS: {
            ACTIVE: 'ACTIVE',
            SAVE_DRAFT: 'SAVE_DRAFT'
        },
        DISCOUNT_TYPE: {
            AMOUNT: 'AMOUNT',
            PERCENT: 'PERCENT'
        }
    }
}
