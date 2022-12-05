const AWS = require('aws-sdk')

// console.log(`process.env.MODE = `,process.env.MODE)
if (process.env.MODE == 'TESTNET') {
    AWS.config.update({
        accessKeyId: process.env[`${process.env.MODE}_AWS_ACCESS_KEY_ID`],
        secretAccessKey: process.env[`${process.env.MODE}_AWS_SECRET_ACCESS_KEY`],
        region: process.env[`${process.env.MODE}_REGION`],
    })
} else {
    AWS.config.update({
        accessKeyId: process.env[`${process.env.MODE}_AWS_ACCESS_KEY_ID`],
        secretAccessKey: process.env[`${process.env.MODE}_AWS_SECRET_ACCESS_KEY`],
        region: process.env[`${process.env.MODE}_AWS_REGION`],
    })
}

module.exports = AWS
