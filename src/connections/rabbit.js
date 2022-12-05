const amqp = require('amqplib')

module.exports = class RabbitClient {
    static instance

    static getInstance() {
        if (!RabbitClient.instance) {
            RabbitClient.instance = new RabbitClient()
        }

        return RabbitClient.instance
    }

    _addEvent(connection) {
        connection.on('blocked', (reason) => {
            console.log('[RabbitMQ] is blocked.', reason)
        })

        connection.on('unblocked', () => {
            console.log('[RabbitMQ] is unblocked.')
        })

        connection.on('close', () => {
            console.log('[RabbitMQ] is disconnected.')
        })

        connection.on('error', (error) => {
            console.error('[RabbitMQ] RABBITMQ_ERROR', error)
        })

        process.on('SIGTERM', () => {
            connection &&
                connection.close(() => {
                    console.log('[RabbitMQ] disconnected through app termination.')
                })
        })
    }

    constructor() {
        this.uri = process.env.RABBIT_URI
    }

    async connect() {
        if (!this.uri) {
            throw new Error('[Rabbit] rabbit host not foud')
        }
        console.log(`[Rabbit] New client: ${this.uri}`)
        this.rabbitClient = await amqp.connect(this.uri)
        console.log(`[Rabbit] connected success!`)
        this._addEvent(this.rabbitClient)
        return this.rabbitClient
    }

    getConnection() {
        return this.rabbitClient
    }
}
