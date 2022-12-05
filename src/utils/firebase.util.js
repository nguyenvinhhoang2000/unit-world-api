const admin = require('firebase-admin')
const {get} = require('lodash')
const serviceAccount =
    process.env.MODE == 'MAINNET'
        ? require('../configs/firebase/prod/credential-firebase-prod.json')
        : require('../configs/firebase/dev/credential-firebase-dev.json')
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

const verifyUserByUid = async (uid) => {
    try {
        const response = await admin.auth().getUser(uid)
        return response
    } catch (error) {
        return null
    }
}

module.exports = {
    verifyUserByUid,
}
