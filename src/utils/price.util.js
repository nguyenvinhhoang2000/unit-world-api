const axios = require('axios')

const instance = axios.create({
    baseURL: 'https://api.coingecko.com/api/v3',
    timeout: 60000,
    headers: {'X-Custom-Header': 'foobar'},
})

const getPrice = async (coin) => {
    try {
        let result = await instance.get(`/simple/price?ids=${coin}&vs_currencies=usd`)

        if (result.status == 200) {
            return result.data[coin]['usd']
        }
        return null
    } catch (error) {
        throw error
    }
}

getVndRate = async() => {
    return 23000 // TODO: update get live rate
}

module.exports = {
    getPrice,
    getVndRate
}
