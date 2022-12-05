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
            PROCESSING: 'PC', //tiến hành trả
            COMPLETED: 'C', //xác nhận giao dịch thành công
            CANCELED: 'CL', //user ko confirm
            FAILED: 'F',
        },
    },
    WITHDRAW_REQUEST: {
        STATUS: {
            PENDING: 'P',
            PROCESSING: 'PC', //tiến hành trả
            COMPLETED: 'C', //rút hoàn thành
            CANCELED: 'CL', //user ko confirm
            FAILED: 'F', //rút failed
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
            CANCELED: 'CL', //user có thể cancel khi status là waiting
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
            CANCELED: 'CL', //user có thể cancel khi status là waiting
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
            STAKING: 'STAKING', //đang staking
            CANCELLED: 'CANCELLED', //HUỶ staking -> chốt lãi sớm,
            WAITING_CLAIM_REWARD: 'WAITING_CLAIM_REWARD', //đã hoàn thành quá trình stake, đợi claimed
            COMPLETED: 'COMPLETED', //đã hoàn thành
        },
        ACTION: {
            STAKING: 'STAKING', // tạo staking
            UNSTAKING: "UNSTAKING", //huỷ staking
            WAITING_CLAIM_REWARD: "WAITING_CLAIM_REWARD", //có thể nhận lãi về 
            CLAIM_REWARDS: "CLAIM_REWARDS" //nhận lãi sau khi kết thúc thời gian stake
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
            PROCESSING: 'PC', //tiến hành trả
            WAITING_SELLER_TRANSFER: 'WST', // đợi người bán chuyển
            FAILED: 'F', // failed khi giao dịch ko được thực hiện -> seller ko chuyển tiền trong thời gian quy định hoặc đã huỷ bỏ giao dịch
            WAITING_BUYER_CONFIRM: 'WBC', //đợi người mua xác nhận đã nhận
            BUYER_COMPLAIN: 'BCP', // buyer khiếu nại vì seller chưa chuyển tiền mà lại đã thông báo là đã gửi (sau 1 khoảng thời gian mà chưa nhận dc mặc dù seller đã confirm)
            SELLER_COMPLAIN: 'SCP', // seller khiếu nại việc buyer ko confirm
            REFUNDING: 'RI', ///khi khiếu nại được giải quyết. tiền được xử lý trả về người bị khoá
            REFUNDED: 'RD', ///khi hoàn thành việc refund
            COMPLETED: 'C', //xác nhận giao dịch thành công - khi buyer confirm nhận dc
        },
    },
    PROJECT: {
        STATUS: {
            WAITING: 'W', //đang xử lý, chua day len contract -> chỉ show cho admin
            PENDING: 'P', //đang mở bán -> da dua len contract
            PROCESSING: 'PC', //đang mở bán -> da dua len contract
            FINISHED: 'FN', //kết thúc mở bán
            RELEASED: 'RL', // release sau khi het lock time, dang duoc chao ban
            SOLD: 'SD', // da ban
            DISTRIBUTED: 'DT', // da phan phoi cho user lai
            CANCELED: 'CL', //huỷ project -> chỉ huỷ khi chưa mở bán
            REFUNDED: 'RF', //Huỷ project -> trả lại tiền nhà đầu tư
            FAILED: 'F', //Huỷ project -> trả lại tiền nhà đầu tư
        },
        STATUS_USER: {
            PENDING: 'P', //đang đợi mở bán
            PROCESSING: 'PC', //đang mở bán
            FINISHED: 'FN', //kết thúc mở bán
            REFUNDED: 'RF', //Huỷ project -> trả lại tiền nhà đầu tư
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
            PENDING: 'P', //đã add request vote/unvote vào queue 
            COMPLETED: 'C', //đã thực hiện xong vote/unvote
            FAILED: 'F', //vote/unvote thất bại
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
