const mongoose = require('mongoose')

// DB setup
//remove dotenv config.config()

async function startSession() {
    return await mongoose.startSession()
}

async function performTransaction(transaction, parameters, prevSession = null) {
    let session = prevSession ? prevSession : await startSession()

    try {
        if (!prevSession) {
            await session.startTransaction({
                readConcern: {level: 'majority'},
                writeConcern: {w: 'majority'},
            })
        }
        const opts = {session, new: true}

        const result = await transaction(parameters, opts)

        if (!prevSession) await commitWithRetry(session)

        return result
    } catch (error) {
        if (!prevSession) await session.abortTransaction()
        throw error // Rethrow so calling function sees error
    } finally {
        if (!prevSession) session.endSession()
    }
}

async function commitWithRetry(session) {
    try {
        await session.commitTransaction()
        console.log('Transaction commit sucessfully')
    } catch (error) {
        if (error.errorLabels && error.errorLabels.indexOf('UnknownTransactionCommitResult') >= 0) {
            console.log('Transaction not performed, retrying....')
            await commitWithRetry(session)
        } else {
            console.log('Error writing to database...')
            throw error
        }
    }
}

module.exports = {
    performTransaction,
    commitWithRetry,
}
