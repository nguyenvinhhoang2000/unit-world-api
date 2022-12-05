const AWS = require('../configs/aws')
AWS.config.update({
    region: 'ap-southeast-1',
})
class Sqs {
    constructor() {
        this.SQS = new AWS.SQS({apiVersion: '2012-11-05'})
    }

    async sendTransaction(queueRL, transaction) {
        const params = {
            MessageBody: JSON.stringify(transaction),
            QueueUrl: queueRL,
        }
        try {
            return await this.SQS.sendMessage(params).promise()
        } catch (error) {
            throw new Error(error)
        }
    }

    async sendTransactionFifo(queueRL, transaction, messageGroupId) {
        const params = {
            MessageBody: JSON.stringify(transaction),
            QueueUrl: queueRL,
            MessageGroupId: messageGroupId,
        }

        try {
            await this.SQS.sendMessage(params).promise()
        } catch (error) {
            throw new Error(error)
        }
    }

    async receiveTransaction(queueRL, num = 1) {
        const params = {
            QueueUrl: queueRL,
            MaxNumberOfMessages: num,
        }
        try {
            const data = await this.SQS.receiveMessage(params).promise()
            return data
        } catch (error) {
            throw new Error(error)
        }
    }

    async deleteTransaction(queueRL, receiptHandle) {
        const params = {
            QueueUrl: queueRL,
            ReceiptHandle: receiptHandle,
        }
        try {
            const data = await this.SQS.deleteMessage(params).promise()
            return data
        } catch (error) {
            throw new Error(error)
        }
    }

    async listQueue() {
        const queues = await this.SQS.listQueues().promise()
        console.log(queues)
    }
}

module.exports = new Sqs()
