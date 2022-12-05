const EntityConst = require('../../constants/entity.constant')

const createRank = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
        },
        no: {
            type: 'number',
        },
        description: {
            type: 'string',
        },
        status: {
            type: ['string', 'null'],
            enum: Object.values(EntityConst.RANK.STATUS),
        },
        config: {
            type: 'object',
            properties: {
                type: {
                    type: ['string', 'null'],
                    enum: Object.values(EntityConst.RANK.RATE_TYPE),
                },
                amount_from: {
                    type: 'number',
                },
                amount_to: {
                    type: 'number',
                },
            },
        },
        discount: {
            type: 'object',
            properties: {
                is_applied: {
                    type: 'boolean',
                },
                type: {
                    type: ['string', 'null'],
                    enum: Object.values(EntityConst.RANK.DISCOUNT_TYPE),
                },
                value: {
                    type: 'number',
                },
            },
        },
        limit: {
            type: 'object',
            properties: {
                is_applied: {
                    type: 'boolean',
                },
                value: {
                    type: 'number',
                },
            },
        },
    },
    required: ['name', 'no', 'description', 'status'],
    additionalProperties: false,
}


const updateRank = {
    type: 'object',
    properties: {
        rank_id: {
            type: "string"
        },
        name: {
            type: 'string',
        },
        no: {
            type: 'number',
        },
        description: {
            type: 'string',
        },
        status: {
            type: ['string', 'null'],
            enum: Object.values(EntityConst.RANK.STATUS),
        },
        config: {
            type: 'object',
            properties: {
                type: {
                    type: ['string', 'null'],
                    enum: Object.values(EntityConst.RANK.RATE_TYPE),
                },
                amount_from: {
                    type: 'number',
                },
                amount_to: {
                    type: 'number',
                },
            },
        },
        discount: {
            type: 'object',
            properties: {
                is_applied: {
                    type: 'boolean',
                },
                type: {
                    type: ['string', 'null'],
                    enum: Object.values(EntityConst.RANK.DISCOUNT_TYPE),
                },
                value: {
                    type: 'number',
                },
            },
        },
        limit: {
            type: 'object',
            properties: {
                is_applied: {
                    type: 'boolean',
                },
                value: {
                    type: 'number',
                },
            },
        },
    },
    required: ['name', 'no', 'description', 'status'],
    additionalProperties: false,
}
const detailRank = {
    type: 'object',
    properties: {
        rank_id: {
            type: 'string',
        },
    },
    required: ['rank_id'],
    additionalProperties: false,
}
module.exports = {
    createRank,
    updateRank,
    detailRank
}
