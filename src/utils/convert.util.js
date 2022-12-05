const CONSTANTS = require('../constants')

const convertNumber = (number, pow = 2) => {
    number = Number(number)
    return Math.round(number * 10 ** pow) / 10 ** pow
}

const plusMonth = (datetime, amount) => {
    datetime = new Date(datetime.getTime() + amount * 30 * 86400000).getTime()
    datetime += 86400000 - (datetime % 86400000)

    return new Date(datetime)
}

const convertDate = (date) => {
    let time = new Date(date)
    // console.log(`time = `, time)
    let month = time.getUTCMonth()
    let day = time.getUTCDate()
    if (month < 10) {
        month = '0' + (month + 1)
    }

    if (day < 10) {
        day = '0' + day
    }
    let tmp = `${month}/${day}/${time.getUTCFullYear()}`
    // console.log(tmp)
    return new Date(tmp)
}

const convertDateMonth = (date) => {
    let time = new Date(date)
    // console.log(`time = `, time)
    let month = time.getUTCMonth()
    if (month < 10) {
        month = '0' + (month + 1)
    }
    let tmp = `${month}/01/${time.getUTCFullYear()}`
    // console.log(tmp)
    return new Date(tmp)
}

const convertTransactionStatus = (status) => {
    let result
    switch (status) {
        case CONSTANTS.Entity.TRANSACTION.STATUS.PENDING:
            result = 'Pending'
            break
        case CONSTANTS.Entity.TRANSACTION.STATUS.COMPLETED:
            result = 'Completed'
            break
        case CONSTANTS.Entity.TRANSACTION.STATUS.FAILED:
            result = 'Failed'
            break
        case 'PC':
            result = 'Processing'
            break
        case CONSTANTS.Entity.TRANSACTION.STATUS.CANCELED:
            result = 'Cancalled'
            break

        default:
            result = 'Failed'
            break
    }
    return result
}

module.exports = {
    convertNumber,
    convertDate,
    convertTransactionStatus,
    plusMonth,
    convertDateMonth,
}
