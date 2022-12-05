const EntityConst = require('../../constants/entity.constant')
const getProjects = {
    type: 'object',
    properties: {
        page: {
            type: ['string', 'number', 'null'],
        },
        limit: {
            type: 'string',
            minLength: 1,
            maxLength: 20,
        },
        key_search: {
            type: ['string', 'null'],
        },
        classification: {
            type: ['string', 'null'],
        },
        type: {
            type: ['string', 'null'],
        },
        sort_by: {
            type: ['string', 'null'],
            enum: Object.values(EntityConst.PROJECT.SORT_BY),
        },
        status: {
            type: ['string', 'null'],
            enum: Object.values(EntityConst.PROJECT.STATUS_USER),
        },
    },
    required: [],
    additionalProperties: false,
}

const getProjectsByAdmin = {
    type: 'object',
    properties: {
        page: {
            type: ['string', 'number', 'null'],
        },
        limit: {
            type: 'string',
            minLength: 1,
            maxLength: 20,
        },
        key_search: {
            type: ['string', 'null'],
        },
        classification: {
            type: ['string', 'null'],
        },
        type: {
            type: ['string', 'null'],
        },
        sort_by: {
            type: ['string', 'null'],
            enum: Object.values(EntityConst.PROJECT.SORT_BY),
        },
        status: {
            type: ['string', 'null'],
            enum: Object.values(EntityConst.PROJECT.STATUS),
        },
    },
    required: [],
    additionalProperties: false,
}

const createProject = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
        },
        no: {
            type: 'string',
        },
        images: {
            type: 'array',
            items: {
                type: 'string',
            },
        },
        avatar: {
            type: 'string',
        },
        classification: {
            type: 'string',
        },
        type: {
            type: 'string',
        },
        general_doc: {
            type: 'string',
        },
        legal_doc: {
            type: 'string',
        },
        ref_doc: {
            type: 'string',
        },
        ref_links: {
            type: 'array',
            items: {
                type: 'string',
            },
        },
        address: {
            type: 'object',
        },
        gen_doc: {
            type: 'string',
        },
        more_info: {
            type: 'string',
        },
        short_description: {
            type: 'string',
        },
        time_config: {
            type: 'object',
            properties: {
                open: {
                    type: ['string', 'number'],
                },
                close: {
                    type: ['string', 'number'],
                },
                invest_duration: {
                    type: 'number',
                },
            },
        },
        expected_interest_rate: {
            type: 'number',
        },
        stock_info: {
            type: 'object',
            properties: {
                total_supply: {
                    type: 'number',
                },
                ido_price: {
                    type: 'number',
                },
            },
            required: ['total_supply'],
            additionalProperties: false,
        },
        project_info: {
            type: 'object',
            properties: {
                images: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                    maxItems: 10,
                    minItems: 1,
                },
                description: {
                    type: 'string',
                },
                overview: {
                    type: 'string',
                },
                juridical: {
                    type: 'object',
                    properties: {
                        images: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                        },
                        docs: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                        },
                        videos: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                        },
                    },
                    additionalProperties: false,
                },
                more_info: {
                    type: 'object',
                },
                address: {
                    type: 'object',
                    properties: {
                        video: {
                            type: 'string',
                        },
                        image: {
                            type: 'string',
                        },
                        full: {
                            type: 'string',
                        },
                        country: {
                            type: 'string',
                        },
                        city: {
                            type: 'string',
                        },
                        district: {
                            type: 'string',
                        },
                        line1: {
                            type: 'string',
                        },
                        line2: {
                            type: 'string',
                        },
                        note: {
                            type: 'string',
                        },
                        location: {
                            type: 'object',
                            properties: {
                                lat: {
                                    type: 'number',
                                },
                                long: {
                                    type: 'number',
                                },
                            },
                        },
                    },
                    additionalProperties: false,
                },
            },
            required: [],
            additionalProperties: false,
        },
    },
    required: ['name', 'short_description', 'time_config', 'expected_interest_rate', 'stock_info'],
    additionalProperties: false,
}

const editProjectOverview = {
    type: 'object',
    properties: {
        project_id: {
            type: 'string',
        },
        name: {
            type: 'string',
        },
        images: {
            type: 'array',
            items: {
                type: 'string',
            },
        },
        avatar: {
            type: 'string',
        },
        classification: {
            type: 'string',
        },
        type: {
            type: 'string',
        },
        general_doc: {
            type: 'string',
        },
        legal_doc: {
            type: 'string',
        },
        ref_doc: {
            type: 'string',
        },
        ref_links: {
            type: 'array',
            items: {
                type: 'string',
            },
        },
        address: {
            type: 'object',
            properties: {
                video: {
                    type: 'string',
                },
                image: {
                    type: 'string',
                },
                full: {
                    type: 'string',
                },
                country: {
                    type: 'string',
                },
                city: {
                    type: 'string',
                },
                district: {
                    type: 'string',
                },
                line1: {
                    type: 'string',
                },
                line2: {
                    type: 'string',
                },
                note: {
                    type: 'string',
                },
                location: {
                    type: 'object',
                    properties: {
                        lat: {
                            type: 'number',
                        },
                        long: {
                            type: 'number',
                        },
                    },
                },
            },
            additionalProperties: false,
        },
        gen_doc: {
            type: 'string',
        },
        more_info: {
            type: 'string',
        },
        short_description: {
            type: 'string',
        },
        time_config: {
            type: 'object',
            properties: {
                open: {
                    type: ['string', 'number'],
                },
                close: {
                    type: ['string', 'number'],
                },
                invest_duration: {
                    type: 'number',
                },
            },
        },
        expected_interest_rate: {
            type: 'number',
        },
        stock_info: {
            type: 'object',
            properties: {
                total_supply: {
                    type: 'number',
                },
                ido_price: {
                    type: 'number',
                },
            },
            required: ['total_supply'],
            additionalProperties: false,
        },
        description: {
            type: 'string',
        },
    },
    required: ['project_id'],
    additionalProperties: false,
}

const editStockInfo = {
    type: 'object',
    properties: {
        project_id: {
            type: 'string',
        },
        total_supply: {
            // tổng lượng stock
            type: 'number',
        },
        ido_price: {
            type: 'number',
        },
        // circulating_supply: { // lượng stock đã bán (lưu thông)
        //     type: 'number'
        // },
    },
    required: ['project_id', 'total_supply', 'ido_price'],
    additionalProperties: false,
}

const deployProject = {
    type: 'object',
    properties: {
        project_id: {
            type: 'string',
        },
    },
    required: ['project_id'],
    additionalProperties: false,
}

const updateAvatar = {
    type: 'object',
    properties: {
        project_id: {
            type: 'string',
        },
        avatar: {
            type: 'object',
        },
    },
    required: ['project_id'],
    additionalProperties: false,
}
const updateProjectInfo = {
    type: "object",
    properties: {
        project_id: {
            type: "string"
        },
        general_doc: {
            type: ['string', 'null'],
        },
        legal_doc: {
            type: ['string', 'null'],
        },
        ref_doc: {
            type: ['string', 'null'],
        },
        ref_links: {
            type: ['array', 'null'],
            items: {
                type: ['string', 'null'],
            },
        },
        images: {
            type: ['array', 'null'],
            items: {
                type: 'string',
            },
        },
        more_info: {
            type: ['object', 'null'],
        },
        address: {
            type: ['object', 'null'],
            properties: {
                video: {
                    type: 'string',
                },
                full: {
                    type: 'string',
                },
                image: {
                    type: 'string',
                },
                country: {
                    type: 'string',
                },
                city: {
                    type: 'string',
                },
                district: {
                    type: 'string',
                },
                line1: {
                    type: 'string',
                },
                line2: {
                    type: 'string',
                },
                note: {
                    type: 'string',
                },
                location: {
                    type: 'object',
                    properties: {
                        lat: {
                            type: 'number',
                        },
                        long: {
                            type: 'number',
                        },
                    },
                },
            },
            additionalProperties: false,
        },
        description: {
            type: ['string', 'null']
        }

    },
    required: ["address", "project_id", "description", "general_doc", "legal_doc", "ref_doc", "ref_links", "more_info", "images"],
    additionalProperties: false,
}

const detailsProject = {
    type: 'object',
    properties: {
        project_id: {
            type: 'string',
        },
    },
    required: ['project_id'],
    additionalProperties: false,
}

module.exports = {
    getProjects,
    getProjectsByAdmin,
    createProject,
    editProjectOverview,
    editStockInfo,
    updateAvatar,
    updateProjectInfo,
    detailsProject,
    deployProject,
}
