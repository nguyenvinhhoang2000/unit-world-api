const responseHandle = async (result, req, res) => {
    try {
        console.log(
            `[Trace - ${new Date()}] ${result.status} - ${result.body.msg} - ${
                (req && req.user && req.user._id) || 'Unauthorization'
            } - ${req.originalUrl} - ${req.method} - ${req.socket.remoteAddress} `,
        )
        return res.status(result.status).send(result.body)
    } catch (error) {
        throw error
    }
}

module.exports = {
    responseHandle,
}
