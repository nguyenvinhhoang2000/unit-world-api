const axios = require('axios')

const instance = axios.create({
    baseURL: process.env[`${process.env.MODE}_DES_PUBG_MS_HOST`],
    timeout: 30000,
    headers: {
        'X-Custom-Header': 'foobar',
    },
})

const getDataPubg = async (start_time, end_time, filter) => {
    try {
        let data = await instance.post('/stats/get-data', {
            start_time,
            end_time,
            filter,
        })
        return data
    } catch (error) {
        console.log(error)
        throw error
    }
}

const addNewPlayer = async (player_name) => {
    try {
        let data = await instance.post('/player/add', {
            player_name,
        })
        return data
    } catch (error) {
        throw error
    }
}

module.exports = {
    getDataPubg,
    addNewPlayer,
}
