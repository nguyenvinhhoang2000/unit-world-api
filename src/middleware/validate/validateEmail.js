const whiteList = ['gmail', 'yahoo', 'hotmail', 'outlook']

const checkEmail = (email) => {
    try {
        let tmp = email.split('@')
        if (tmp.length != 2) {
            return false
        }
        let domainCheck = tmp[1].split('.')[0]
        for (let i = 0; i < whiteList.length; i++) {
            if (domainCheck == whiteList[i]) {
                return true
            }
        }
        return false
    } catch (error) {
        console.log(`email is incorrect format, `, error)
        return false
    }
}

module.exports = checkEmail
