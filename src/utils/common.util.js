const CONSTANTS = require('../constants/entity.constant')

// const checkAdminRole = (role) => {
//     let rm = 0;
//     switch (role) {
//         case CONSTANTS.ADMIN.ROLES.SUPER_ADMIN:
//             rm = 9
//             break;
//         case CONSTANTS.ADMIN.ROLES.ADMIN:
//             rm = 8
//             break;
//         case CONSTANTS.ADMIN.ROLES.MANAGER:
//             rm = 7
//             break;
//         case CONSTANTS.ADMIN.ROLES.SUPPORTER:
//             rm = 6
//             break;
//         default:
//             rm = 0
//             break;
//     }
//     return rm
// }

const genRandomPassword = () => {
    let CHARS_LOW_CASE = 'qwertyuioplkjhgfdsazxcvbnm'
    let CHARS_UP_CASE = 'QWERTYUIOPLKJHGFDSAZXCVBNM'
    let NUMBERS = '1234567890'
    let SPECIAL_CHAR = '!@#$%&*_-='
    let result = ''
    for (let i = 0; i < 4; i++) {
        result += CHARS_LOW_CASE[Math.round(Math.random() * (CHARS_LOW_CASE.length - 1))]
    }
    for (let i = 0; i < 3; i++) {
        result += CHARS_UP_CASE[Math.round(Math.random() * (CHARS_UP_CASE.length - 1))]
    }
    for (let i = 0; i < 2; i++) {
        result += NUMBERS[Math.round(Math.random() * (NUMBERS.length - 1))]
    }
    for (let i = 0; i < 1; i++) {
        result += SPECIAL_CHAR[Math.round(Math.random() * (SPECIAL_CHAR.length - 1))]
    }
    return result
}

const genRandomVoucherCode = () => {
    let CHARS = 'qwertyuioplkjhgfdsazxcvbnm1234567890QWERTYUIOPLKJHGFDSAZXCVBNM'
    let result = ''
    for (let i = 0; i < 10; i++) {
        result += CHARS[Math.round(Math.random() * (CHARS.length - 1))]
    }
    return result
}

const genUsernameRandom = (email) => {
    let first = email.split('@')[0]
    let CHARS = 'qwertyuioplkjhgfdsazxcvbnm1234567890QWERTYUIOPLKJHGFDSAZXCVBNM'
    let result = ''
    for (let i = 0; i < 3; i++) {
        result += CHARS[Math.round(Math.random() * (CHARS.length - 1))]
    }
    return first + result
}

const genNo = () => {
    let CHARS = '1234567890QWERTYUIOPLKJHGFDSAZXCVBNM'
    let CHARS_UP_CASE = 'QWERTYUIOPLKJHGFDSAZXCVBNM'
    let result = ''
    for (let i = 0; i < 1; i++) {
        result += CHARS_UP_CASE[Math.round(Math.random() * (CHARS_UP_CASE.length - 1))]
    }
    for (let i = 0; i < 5; i++) {
        result += CHARS[Math.round(Math.random() * (CHARS.length - 1))]
    }
    return result
}

const createFileName = (file) => {
    const newFileName = file.originalname.replace(/ - /g, ' ').replace(/ /g, '-')
    const fileNames = newFileName.split('.')
    let filename = ''
    for (let i = 0; i < fileNames.length - 1; i++) {
        filename = `${filename + fileNames[i].trim().replace(' ', '-')}`
        filename = filename.trim().replace(' ', '-')
    }
    filename = `${filename}-${Date.now()}.${fileNames[fileNames.length - 1]}`
    return filename
}

const getClientIp = (req) => {
    return (req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null))
}

function getRandomElementsFromArray(array, numberOfRandomElementsToExtract = 1) {
    const elements = []

    function getRandomElement(arr) {
        if (elements.length < numberOfRandomElementsToExtract) {
            const index = Math.floor(Math.random() * arr.length)
            const element = arr.splice(index, 1)[0]

            elements.push(element)

            return getRandomElement(arr)
        } else {
            return elements
        }
    }

    return getRandomElement([...array])
}

const retryException = async (promiseFn, params = [], maxTries = 3, delay = 1000) => {
    try {
        return await promiseFn(...params)
    } catch (e) {
        console.log({maxTries})
        if (maxTries > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay))
            return await retryException(promiseFn, params, maxTries - 1, delay)
        }
        throw e
    }
}

const getPagination = (page=1, size = 20) => {
    if(!page) page = 1
    else page = Number(page)
    if(!size) size = 20
    else size = Number(size)
    return ({
      limit: size,
      skip: (page - 1) * size,
    })
  }

module.exports = {
    genRandomPassword,
    createFileName,
    getClientIp,
    genRandomVoucherCode,
    genUsernameRandom,
    getRandomElementsFromArray,
    retryException,
    genNo,
    getPagination
}
