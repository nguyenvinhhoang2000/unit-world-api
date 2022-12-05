//remove dotenv config.config()

module.exports = {
    url: process.env[`${process.env.MODE}_MONGO_STRING`],
    options: {
        wtimeout: 10000,
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: false,
        useCreateIndex: true,
        poolSize: 10,
    },
}
