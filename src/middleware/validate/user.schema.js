const loginSchema = {
    type: 'object',
    properties: {
        username: {
            type: 'string',
        },
        password: {
            type: 'string',
            minLength: 8,
            maxLength: 16,
        },
        re_captcha: {
            type: ['string', 'null'],
        },
        tfa_code: {
            type: ['string', 'null'],
        },
    },
    required: ['username', 'password'],
    additionalProperties: false,
}

const registerSchema = {
    type: 'object',
    properties: {
        username: {
            type: 'string',
        },
        name: {
            type: 'string',
        },
        password: {
            type: 'string',
            minLength: 8,
            maxLength: 16,
        },
        confirm_password: {
            type: 'string',
            minLength: 8,
            maxLength: 16,
        },
        email: {
            type: 'string',
        },
        country: {
            type: 'string',
        },
        dob: {
            type: 'string',
        },
        gender: {
            type: 'string',
            enum: ['M', 'F', '0'],
        },
        subscribe: {
            type: 'number',
        },
        referrer: {
            type: ['string', 'null'],
        },
        re_captcha: {
            type: ['string', 'null'],
        },
    },
    required: ['username', 'name', 'password', 'confirm_password', 'email'],
    additionalProperties: false,
}

const resendVerifyEmailSchema = {
    type: 'object',
    properties: {
        email: {
            type: 'string',
        },
        re_captcha: {
            type: ['string', 'null'],
        },
    },
    required: ['email'],
    additionalProperties: false,
}

const verifyUserSchema = {
    type: 'object',
    properties: {
        email: {
            type: 'string',
        },
        user_id: {
            type: 'string',
        },
        number_verify: {
            type: 'string',
            minLength: 6,
            maxLength: 6,
        },
        re_captcha: {
            type: ['string', 'null'],
        },
    },
    required: ['email', 'user_id', 'number_verify'],
    additionalProperties: false,
}

const forgotPasswordSchema = {
    type: 'object',
    properties: {
        email: {
            type: 'string',
        },
        re_captcha: {
            type: ['string', 'null'],
        },
    },
    required: ['email'],

    additionalProperties: false,
}

const confirmForgotPasswordSchema = {
    type: 'object',
    properties: {
        user_id: {
            type: 'string',
        },
        number_verify: {
            type: 'string',
            minLength: 6,
            maxLength: 6,
        },
        password: {
            type: 'string',
            minLength: 8,
            maxLength: 16,
        },
        confirm_password: {
            type: 'string',
            minLength: 8,
            maxLength: 16,
        },
        re_captcha: {
            type: ['string', 'null'],
        },
    },
    required: ['user_id', 'number_verify', 'password', 'confirm_password'],

    additionalProperties: false,
}

const changePasswordSchema = {
    type: 'object',
    properties: {
        new_password: {
            type: 'string',
            minLength: 8,
            maxLength: 16,
        },
        confirm_new_password: {
            type: 'string',
            minLength: 8,
            maxLength: 16,
        },
        old_password: {
            type: 'string',
            minLength: 8,
            maxLength: 16,
        },
        re_captcha: {
            type: ['string', 'null'],
        },
    },
    required: ['new_password', 'old_password', 'confirm_new_password'],
    additionalProperties: false,
}

const updateInfoSchema = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
        },
        country: {
            type: 'string',
        },
        birthday: {
            type: 'string',
        },
    },
    required: ['name', 'country', 'birthday'],
    additionalProperties: false,
}

const walletMappingSchema = {
    type: 'object',
    properties: {
        address: {
            type: 'string',
            minLength: 42,
            maxLength: 42,
        },
        password: {
            type: 'string',
        },
    },
    required: ['address', 'password'],
    additionalProperties: false,
}

const searchUserSchema = {
    type: 'object',
    properties: {
        key_search: {
            type: 'string',
        },
    },
    required: ['key_search'],
    additionalProperties: false,
}

module.exports = {
    loginSchema,
    registerSchema,
    resendVerifyEmailSchema,
    verifyUserSchema,
    forgotPasswordSchema,
    confirmForgotPasswordSchema,
    changePasswordSchema,
    updateInfoSchema,
    walletMappingSchema,
    searchUserSchema,
}
