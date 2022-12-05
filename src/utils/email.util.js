require('dotenv').config()
const fs = require('fs')
let htmlTemplateRegister = fs.readFileSync(__dirname + '/email/registration-confirm-code/' + 'index.html', 'utf8')
let htmlTemplateP2pSend = fs.readFileSync(__dirname + '/email/p2p-notice/' + 'p2p-send.html', 'utf8')
let htmlTemplateP2pFinalize = fs.readFileSync(__dirname + '/email/p2p-notice/' + 'p2p-finalize.html', 'utf8')

const api_key = process.env[`${process.env.MODE}_MAILGUN_API_KEY`]
const domain = process.env[`${process.env.MODE}_MAILGUN_DOMAIN`]

const mailgun = require('mailgun-js')({apiKey: api_key, domain: domain})


function sendEmailP2pSendNotice({email, orderId, orderNo, stock, quantity, totalPrice, unit, bank, type = 1}) {
    try {
        console.log(email)
        let content1, content2, link
        if (type == 1) {
            content1 = `You are about to receive ${(totalPrice)} (${unit}) for selling ${quantity} of token ${stock} via ${bank}`
            content2 = `Please click here to execute the transaction (order no: ${orderNo})`
            link = `https://${orderId}`
        }

        let contentEmail = htmlTemplateP2pSend
        contentEmail = contentEmail.replace('CONFIRM_LINK', link)
        contentEmail = contentEmail.replace('CONTENT1', content1)
        contentEmail = contentEmail.replace('CONTENT2', content2)

        const data = {
            from: 'REX - Real Estate Exchange <noreply@rex.io>',
            to: email,
            subject: 'REX - Real Estate Exchange Verification',
            html: contentEmail,
        }

        mailgun.messages().send(data, function (error, body) {
            if (error) {
                console.error(error)
            }
            // console.log(body)
        })
    } catch (error) {
        console.log(error)
    }
}

function sendEmailP2pFinalizeNotice({email, orderId, orderNo, stock, quantity, totalPrice, unit, bank, type = 1}) {
    try {
        console.log(email)
        let content1, content2, link
        if (type == 1) {
            content1 = `You are successful to buy ${quantity} of token ${stock} for ${(totalPrice)} (${unit})`
            content2 = `Please click here to view the transaction (order no: ${orderNo})`
            link = `https://${orderId}`
        }

        let contentEmail = htmlTemplateP2pFinalize
        contentEmail = contentEmail.replace('VIEW_LINK', link)
        contentEmail = contentEmail.replace('CONTENT1', content1)
        contentEmail = contentEmail.replace('CONTENT2', content2)

        const data = {
            from: 'REX - Real Estate Exchange <noreply@rex.io>',
            to: email,
            subject: 'REX - Real Estate Exchange Verification',
            html: contentEmail,
        }

        mailgun.messages().send(data, function (error, body) {
            if (error) {
                console.error(error)
            }
            // console.log(body)
        })
    } catch (error) {
        console.log(error)
    }
}

function sendEmail(email, number, type = 1) {
    try {
        console.log(email)
        let content1, content2
        if (type == 1) {
            content1 = 'Thanks for signing up REX - Real Estate Exchange!'
            content2 = 'Here is your account activation code'
        } else if (type == 2) {
            content1 = 'Thank you for participating in REX - Real Estate Exchange!'
            content2 = 'To reset your password, enter your verification code'
        }
        let contentEmail = htmlTemplateRegister
        contentEmail = contentEmail.replace('VERIFY_NUMBER', number)
        contentEmail = contentEmail.replace('CONTENT1', content1)
        contentEmail = contentEmail.replace('CONTENT2', content2)

        const data = {
            from: 'REX - Real Estate Exchange <noreply@rex.io>',
            to: email,
            subject: 'REX - Real Estate Exchange Verification',
            html: contentEmail,
        }

        mailgun.messages().send(data, function (error, body) {
            if (error) {
                console.error(error)
            }
            // console.log(body)
        })
    } catch (error) {
        console.log(error)
    }
}

function sendEmailDeposit(email, number, type, txid) {
    try {
        const explorerDomain = process.env.MODE=='TESTNET' ? 'https://testnet.bscscan.com' : 'https://bscscan.com'
        const data = {
            from: 'REX - Real Estate Exchange <noreply@rex.io>',
            to: email,
            subject: `[Real Estate] ${type} Token Received - ${new Date().toISOString()}`,
            text: `Your received token of ${number} ${type} is now available in your account. Log in to check your balance. \n <ref: ${explorerDomain}/tx/${txid} >`,
        }

        mailgun.messages().send(data, function (error, body) {
            if (error) {
                console.error(error)
            }
        })
    } catch (error) {
        console.log(error)
    }
}

function sendEmailWithdraw(email, txhash, amount, toAddress, gateway, currency) {
    try {
        const status = txhash ? 'Completed' : 'Failed'
        const data = {
            from: 'REX - Real Estate Exchange <noreply@rex.io>',
            to: email,
            subject: `[Real Estate] ${currency} Withdrawal ${status} - ${new Date().toISOString()}`,
            text: `Your withdrawal of ${amount} ${currency} to ${toAddress} has been ${status}. Log in to check your balance. \n <${gateway} txid: ${txhash} >`,
        }

        mailgun.messages().send(data, function (error, body) {
            if (error) {
                console.error(error)
            }
        })
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    sendEmail,
    sendEmailDeposit,
    sendEmailWithdraw,
    sendEmailP2pSendNotice,
    sendEmailP2pFinalizeNotice
}
