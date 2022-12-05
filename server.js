const path = require('path')
const NODE_ENV = process.env.NODE_ENV || ''

const envFile = `${NODE_ENV}.env`
const envPath = path.resolve(__dirname, envFile)
require('dotenv').config({path: envPath})

const express = require('express')
const bodyParser = require('body-parser')
const container = require('./src/configs/dependencies/container')
const ErrorHandler = require('./src/utils/error_handler.util')
const {getEnv} = require('./src/utils/getEnv.util')
let morgan = require('morgan');
const cors = require('cors')
const {rateLimit} = require('express-rate-limit')
const limiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 100, // Limit each IP to 60 requests per `window` (here, per 5 minutes)
    message: 'Too many requests created from this IP, please try again after 5 minutes',
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const app = express();
if(process.env.NODE_ENV !== 'PROD' && process.env.NODE_ENV !== 'MAINNET') {
    //use morgan to log at command line
    app.use(morgan('combined')); 
}
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
    origin: process.env.MODE == 'MAINNET' ? "*" : "*",
}));
//app.use(limiter)

// setTimeout(async () => {
//     // Init database
//     const DatabaseInit = require('./src/inits')
//     await DatabaseInit.init()
// }, 5000)
// load routes

// Init workers
if(getEnv('WORKER_ENABLE', false) === 'true') {
    require('./src/workers')()
}

// Init subscribers
if(getEnv('SUBSCRIBER_ENABLE', false) === 'true') {
    require('./src/subscribers')()
}

// Register router
app.use('/', container.resolve('router').routerApi())

app.use(ErrorHandler);

const port = process.env.PORT || '9009';
app.set('port', port);

// Create HTTP server.
app.listen(port, () => console.log(`http://localhost:${port}`));

module.exports = app