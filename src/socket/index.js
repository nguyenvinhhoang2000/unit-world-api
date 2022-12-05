require('dotenv').config()

const express = require('express')
const app = express()
const http = require('http')
const bodyParser = require('body-parser')

const cors = require('cors')

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(cors())

const server = http.createServer(app)
const {Server} = require('socket.io')

const io = new Server(server, {
    cors: {
        origin: process.env.MODE == 'MAINNET' ? '*' : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
    },
})

io.on('connection', (socket) => {
    console.log('a user connected')
})

server.listen(6080, () => {
    console.log('socket listening on *:6080')
})
